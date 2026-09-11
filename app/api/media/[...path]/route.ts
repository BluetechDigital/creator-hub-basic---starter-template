/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { NextResponse } from "next/server";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const CMS_URL: string | undefined = process.env.CMS_URL;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX WordPress uploads root XXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Every request this route serves is implicitly scoped under WordPress's own
 * media-library directory — this must never become a general-purpose reverse
 * proxy onto the CMS (`wp-admin`, `wp-login.php`, `wp-json`, the CMS's own
 * public REST API separate from the GraphQL endpoint this app actually uses,
 * and everything else stay unreachable through it). `config/cmsMediaUrl.ts`
 * strips this exact same segment before handing a URL to the browser
 * (`/api/media/2024/01/photo.jpg`, not `/api/media/wp-content/uploads/2024/01/photo.jpg`
 * — one fewer string that unambiguously identifies the CMS as WordPress at
 * all) — this constant is what re-inserts it before the real fetch, so the
 * two files have to agree on it, which is why it isn't duplicated as a
 * literal in both places.
 */
const WP_UPLOADS_PREFIX = "/wp-content/uploads";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Media Proxy XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Proxies a WordPress media-library file (an image, a PDF, any upload) from
 * the real CMS origin through this app's own domain. `config/cmsMediaUrl.ts`
 * rewrites every CMS-sourced URL this app renders into `/api/media/...`
 * before it ever reaches the browser — so a visitor's page source, a "copy
 * image address", or a document's "copy link address" only ever shows this
 * app's own domain, never the CMS's real hostname, and never
 * `wp-content/uploads` either (see that file's own doc comment for the full
 * rationale).
 *
 * `path` is the file's location *under* `wp-content/uploads/` — a proxied
 * URL looks like `/api/media/2024/01/photo.jpg`, not
 * `/api/media/wp-content/uploads/2024/01/photo.jpg` — this handler re-adds
 * `WP_UPLOADS_PREFIX` and `CMS_URL` to reconstruct the real fetch and forwards
 * the request; it never accepts or trusts a client-supplied CMS origin.
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

	// Reject a `..`/`.` segment (or an empty one, from a doubled slash).
	// `fetch()` resolves `..` segments when it parses the resulting URL, so a
	// request like `/api/media/../../wp-login.php` would otherwise walk back
	// up out of `WP_UPLOADS_PREFIX` and reach `${CMS_URL}/wp-login.php` —
	// exactly the path this route exists to keep unreachable. Confirmed live
	// while first building this route: without this check, that escape is
	// possible regardless of what prefix the fetch URL is built from.
	if (path.length === 0 || path.some((segment) => !segment || segment === "." || segment === "..")) {
		return NextResponse.json({ error: "Not found." }, { status: 404 });
	}

	const relativePath = path.join("/");

	let upstreamResponse: Response;

	try {
		upstreamResponse = await fetch(`${CMS_URL}${WP_UPLOADS_PREFIX}/${relativePath}`, {
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
