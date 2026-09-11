/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { NextResponse } from "next/server";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const CMS_URL: string | undefined = process.env.CMS_URL;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Allowed path prefixes XXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * The only WordPress paths this proxy will forward a request for. This must
 * never become a general-purpose reverse proxy onto the CMS — `wp-admin`,
 * `wp-login.php`, `wp-json` (the CMS's own public REST API, separate from the
 * GraphQL endpoint this app actually uses), and everything else stay
 * unreachable through it. `uploads/` is WordPress's own media-library
 * directory, the only thing `config/cmsMediaUrl.ts` ever rewrites a URL into.
 */
const ALLOWED_PREFIXES = ["wp-content/uploads/"];

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Media Proxy XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Proxies a WordPress media-library file (an image, a PDF, any upload) from
 * the real CMS origin through this app's own domain. `config/cmsMediaUrl.ts`
 * rewrites every CMS-sourced URL this app renders into `/api/media/...`
 * before it ever reaches the browser — so a visitor's page source, a "copy
 * image address", or a document's "copy link address" only ever shows this
 * app's own domain, never the CMS's real hostname (see that file's own doc
 * comment for the full rationale).
 *
 * `path` is the WordPress-relative path with `wp-content/uploads/` already
 * included (a proxied URL looks like `/api/media/wp-content/uploads/2024/…`)
 * — this handler just re-prefixes it with `CMS_URL` and forwards the
 * request; it never accepts or trusts a client-supplied CMS origin.
 * @param params Route params promise; resolves to `{path}`, the dynamic
 * catch-all segments after `/api/media/`.
 */
export const GET = async (
	_request: Request,
	{ params }: { params: Promise<{ path: string[] }> },
): Promise<Response> => {
	if (!CMS_URL) {
		return NextResponse.json({ error: "Media proxy is not configured (CMS_URL unset)." }, { status: 503 });
	}

	const { path } = await params;

	// Reject a `..`/`.` segment (or an empty one, from a doubled slash) before
	// the prefix check below, not after — `relativePath.startsWith(...)` is a
	// pure string comparison and does NOT stop a path like
	// `wp-content/uploads/../../wp-login.php` from passing it: that string
	// genuinely starts with "wp-content/uploads/", but `fetch()` resolves the
	// `..` segments when it parses the resulting URL, reaching
	// `${CMS_URL}/wp-login.php` — exactly the path this allowlist exists to
	// block. Confirmed live while reviewing this route: without this check,
	// the prefix restriction below is bypassable, not enforced.
	if (path.length === 0 || path.some((segment) => !segment || segment === "." || segment === "..")) {
		return NextResponse.json({ error: "Not found." }, { status: 404 });
	}

	const relativePath = path.join("/");

	if (!ALLOWED_PREFIXES.some((prefix) => relativePath.startsWith(prefix))) {
		return NextResponse.json({ error: "Not found." }, { status: 404 });
	}

	let upstreamResponse: Response;

	try {
		upstreamResponse = await fetch(`${CMS_URL}/${relativePath}`, {
			// Media is effectively immutable once uploaded — WordPress doesn't
			// version a filename on re-upload — so this matches the same
			// 24-hour revalidate window every graphql/CMS/*.ts fetch already
			// uses for the URLs that point at this same file.
			next: { revalidate: 86400 },
		});
	} catch (error: unknown) {
		console.error(`Media proxy fetch failed for "${relativePath}":`, error);
		return NextResponse.json({ error: "Upstream fetch failed." }, { status: 502 });
	}

	if (!upstreamResponse.ok || !upstreamResponse.body) {
		return NextResponse.json(
			{ error: "Not found." },
			{ status: upstreamResponse.status === 404 ? 404 : 502 },
		);
	}

	return new NextResponse(upstreamResponse.body, {
		status: 200,
		headers: {
			"Content-Type": upstreamResponse.headers.get("content-type") ?? "application/octet-stream",
			// Inline, not attachment — a PDF should preview in the browser the
			// same way it would loading straight from the CMS, not force a
			// download the CMS URL itself wouldn't have forced either.
			"Content-Disposition": "inline",
			"Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
		},
	});
};
