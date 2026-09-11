import "server-only";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Rewrites CMS-origin media URLs (featured images, SEO OG images, and any
 * `<img>`/`<a href>` inside CMS-authored WYSIWYG HTML — including document
 * links, e.g. a PDF under `/wp-content/uploads/...`) to a same-origin path
 * this app proxies itself (`app/api/media/[...path]/route.ts`) — e.g.
 * `https://cbf.crdbbankfoundation.co.tz/wp-content/uploads/2024/01/photo.jpg`
 * becomes `/api/media/2024/01/photo.jpg`, not just the domain swapped out —
 * so the CMS's real hostname never appears in anything a visitor's browser
 * renders or can copy — not an `<img src>`, not a "copy link address" on a
 * document, not page source — and `wp-content/uploads`, the one path segment
 * that unambiguously identifies the CMS as WordPress at all (independent of
 * whose domain it's on), doesn't either; see `stripWpUploadsPrefix` for why
 * the `YYYY/MM` date path underneath it is kept rather than flattened
 * further. `import "server-only"` guards against this ever being pulled
 * into a Client Component bundle by accident: `CMS_URL`/`DEV_CMS_URL` aren't
 * `NEXT_PUBLIC_`-prefixed, so Next wouldn't inline a real value into client
 * code either way, but a silent `undefined` there would just as silently stop
 * rewriting anything — this turns that into a build-time error instead.
 *
 * Every CMS-sourced URL passes through one of the two functions below at the
 * point it's unwrapped from a GraphQL response (`graphql/CMS/*.ts`) or a
 * flexible-content block's prose field (`RenderFlexibleContent.tsx`) — never
 * at the component that finally renders it, so no render path can forget to
 * call this and leak the origin by omission.
 *
 * **Jetpack Photon (Site Accelerator).** If it's active on the CMS — this
 * project's own `IMAGE_REMOTE_PATTERNS_HOSTNAME_ONE=i0.wp.com`
 * (`.env.example`) and `ArticleContent.test.tsx`'s own fixture content both
 * already assumed it is — WPGraphQL hands back image URLs shaped like
 * `https://i0.wp.com/<cms-hostname>/wp-content/uploads/...`, not
 * `${CMS_URL}/wp-content/uploads/...` directly: Photon wraps the *original*
 * URL into its *own* path instead of proxying through the CMS's own domain.
 * A plain `url.startsWith(CMS_URL)` check never matches that (the URL's real
 * origin is `i0.wp.com`), so the CMS's real hostname was leaking straight
 * through, embedded in the Photon path — confirmed live, the same class of
 * gap the sibling CBF-Rebuild project independently found and fixed first.
 * `resolvePhotonUrl` below handles the wrapping (matched by hostname, not by
 * origin string — see its own doc comment for why that distinction matters),
 * so a Photon URL and a direct one both resolve to the same proxy path shape.
 */

const CMS_URL: string | undefined = process.env.CMS_URL;
const DEV_CMS_URL: string | undefined = process.env.DEV_CMS_URL;

// Both are checked — which one a given URL actually starts with depends on
// which the live CMS happened to resolve at request time, not on which
// environment this app is currently running in.
const CMS_ORIGINS: string[] = [CMS_URL, DEV_CMS_URL].filter((url): url is string => Boolean(url));

// Just the hostnames (no protocol), for matching against what Photon wraps
// into its own URL path — e.g. "cbf.crdbbankfoundation.co.tz", not
// "https://cbf.crdbbankfoundation.co.tz".
const CMS_HOSTNAMES: string[] = CMS_ORIGINS
	.map((origin) => {
		try {
			return new URL(origin).hostname;
		} catch {
			return undefined;
		}
	})
	.filter((hostname): hostname is string => Boolean(hostname));

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXX Dropping the WordPress-specific prefix XXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// The one path segment that unambiguously identifies the CMS as WordPress at
// all — every proxied URL drops it, not just the domain.
const WP_UPLOADS_PREFIX = "/wp-content/uploads";

/**
 * Strips the WordPress-specific `/wp-content/uploads` segment from a path,
 * keeping the `/YYYY/MM/filename` structure underneath it —
 * `/wp-content/uploads/2024/01/about-us-banner-1.jpg` becomes
 * `/2024/01/about-us-banner-1.jpg`, not just `/about-us-banner-1.jpg`.
 *
 * Deliberately not flattened all the way to the bare filename: WordPress
 * buckets uploads by year/month *specifically* to avoid filename collisions
 * (generic names like `banner.jpg` get reused across unrelated
 * pages/months constantly) — the date segments are what keep that guarantee,
 * not an implementation detail to throw away. Flattening further would need
 * a filename -> real-path lookup (a persistent key-value store, built at
 * content-fetch time and read at proxy-fetch time) for what's a fairly
 * marginal secrecy gain on top of what dropping this one string already
 * achieves, and this project deliberately doesn't carry that kind of shared
 * state anywhere — `config/rateLimit.ts`'s own doc comment flags the same
 * "would need Upstash/Vercel KV for a cross-instance guarantee" trade-off
 * for a different feature and stays without it too.
 *
 * `app/api/media/[...path]/route.ts` re-inserts this exact same prefix
 * before fetching from the real CMS — the two must agree on this constant,
 * which is why it's dropping the prefix, not a name they each hardcode
 * separately. Every proxied path is implicitly scoped to this directory as a
 * result: the route no longer needs (or has) an allowlist-of-prefixes check,
 * just the path-traversal guard it already had.
 * @param path A path starting with `/wp-content/uploads/...`.
 * @returns The same path with that prefix removed. Returns `path` unchanged
 * if it doesn't actually start with the expected prefix — every call site
 * here has already confirmed the URL is CMS-origin by the time this runs.
 */
const stripWpUploadsPrefix = (path: string): string =>
	path.startsWith(WP_UPLOADS_PREFIX) ? path.slice(WP_UPLOADS_PREFIX.length) : path;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Jetpack Photon CDN XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Jetpack rotates image requests across four subdomains (i0-i3.wp.com), not
// just one.
const PHOTON_HOST_PATTERN = /^https:\/\/i[0-3]\.wp\.com\//i;

/**
 * Resolves a Photon-wrapped URL directly to its `/api/media/...` proxy path,
 * when `url` wraps a *known* CMS host — e.g.
 * `https://i0.wp.com/cbf.crdbbankfoundation.co.tz/wp-content/uploads/2024/01/x.jpg?fit=800%2C600&ssl=1`
 * becomes `/api/media/2024/01/x.jpg` (see `stripWpUploadsPrefix` for why the
 * `wp-content/uploads` segment specifically is dropped but the date path
 * underneath it is kept). Matched by **hostname alone**,
 * not by comparing against the full `CMS_URL`/`DEV_CMS_URL` origin string the
 * way a direct URL is (see `resolveToMediaProxyPath` below) — Photon discards
 * the original scheme and port entirely when it wraps a URL, so a
 * `startsWith(CMS_URL)`-style check could never match here even for a
 * perfectly genuine Photon URL, production `https://` CMS or a plain `http://
 * localhost:PORT` dev one alike. Confirmed live while building this: an
 * origin-string match against a reconstructed `https://<hostname>` URL
 * silently failed for exactly this project's own local dev/E2E setup, where
 * `CMS_URL` is `http://localhost:<port>` — matching by hostname avoids that
 * entirely. Photon's own query params (resize/crop/quality directives,
 * `ssl=1`) are dropped — meaningless against a direct file fetch, and this
 * app's own `next/image` optimizer re-does resizing anyway once the URL is
 * proxied through `/api/media`.
 *
 * A Photon URL wrapping some *other* site (a CMS editor could technically
 * paste any wordpress.com-accelerated image URL into content) resolves to
 * `null` — only unwraps this project's own configured CMS origin(s), never
 * treated as a signal to trust arbitrary Photon URLs.
 * @param url Any URL — only resolved if it actually matches the Photon host
 * pattern *and* wraps a known CMS hostname.
 * @returns The `/api/media/...` path, or `null` if `url` isn't a Photon URL
 * wrapping a known CMS host.
 */
const resolvePhotonUrl = (url: string): string | null => {
	if (!PHOTON_HOST_PATTERN.test(url)) return null;

	const afterPhotonHost = url.replace(PHOTON_HOST_PATTERN, "");
	const wrappedHostname = CMS_HOSTNAMES.find((hostname) => afterPhotonHost.startsWith(hostname));
	if (!wrappedHostname) return null;

	const pathAndQuery = afterPhotonHost.slice(wrappedHostname.length);
	const pathOnly = pathAndQuery.split("?")[0];
	return `/api/media${stripWpUploadsPrefix(pathOnly)}`;
};

/**
 * The shared resolver both functions below build on: given any raw URL,
 * returns its `/api/media/...` path if it's CMS-origin — Photon-wrapped
 * (matched by hostname, see `resolvePhotonUrl`) or direct (matched by exact
 * origin string) — or `null` if it isn't CMS-origin at all (an external
 * image, a Gravatar avatar, a YouTube/Instagram CDN URL, a Photon URL
 * wrapping some other site). Either way, `/wp-content/uploads` is dropped
 * from the result — see `stripWpUploadsPrefix`.
 *
 * The direct-URL branch drops any query string too (`url.split("?")[0]`,
 * matching the Photon branch) — a genuine CMS media URL this codebase ever
 * hands to `next/image`/an `<a href>` doesn't carry a meaningful one (no
 * cache-busting `?ver=` convention in use here), and dropping it uniformly
 * keeps both branches' output shape identical rather than direct URLs
 * silently being allowed to carry query noise Photon URLs never could.
 * @param url Any absolute URL.
 */
const resolveToMediaProxyPath = (url: string): string | null => {
	const photonResolved = resolvePhotonUrl(url);
	if (photonResolved) return photonResolved;

	const origin = CMS_ORIGINS.find((candidate) => url.startsWith(candidate));
	if (!origin) return null;

	const pathOnly = url.slice(origin.length).split("?")[0];
	return `/api/media${stripWpUploadsPrefix(pathOnly)}`;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Single URL fields XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Rewrites one absolute CMS-origin URL (`featuredImage.sourceUrl`,
 * `opengraphImage.mediaItemUrl`, a theme-options `backgroundImage.sourceUrl`,
 * ...) to `/api/media/...` — Photon-wrapped or not, see `resolvePhotonUrl`
 * above (and `stripWpUploadsPrefix` for why the result is
 * `/api/media/2024/01/x.jpg`, not `/api/media/wp-content/uploads/2024/01/x.jpg`).
 * Anything that isn't CMS-origin — an external image, a Gravatar avatar, a
 * YouTube/Instagram CDN URL — is returned completely unchanged.
 * @param url The raw URL as returned by WPGraphQL, or `null`/`undefined`.
 * @returns The rewritten same-origin path, or `url` unchanged if it wasn't
 * CMS-origin (or was empty).
 */
export const rewriteCmsMediaUrl = <T extends string | null | undefined>(url: T): T => {
	if (!url) return url;
	return (resolveToMediaProxyPath(url) ?? url) as T;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX WYSIWYG HTML string fields XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Rewrites every `src="..."`/`href="..."` attribute pointing at a CMS
 * origin — Photon-wrapped or direct — inside a raw WYSIWYG HTML string: a
 * post's `content`/`excerpt`, a TitleParagraph block's `paragraph` field,
 * the error page's `errorPageContent.paragraph`. Catches both embedded
 * images and document links (a PDF a CMS editor linked directly from the
 * media library) in one pass, since both attributes carry the same URL shape.
 *
 * A plain regex over the serialized markup rather than a full DOM
 * parse/rebuild — this runs on WordPress's own generated WYSIWYG output,
 * which reliably double-quotes attribute values, and every render path still
 * sanitizes the result with DOMPurify afterwards regardless of what this pass
 * does to it (`ArticleContent.tsx`, `Paragraph.tsx`), so a pass that's a
 * no-op on malformed markup fails safe rather than needing to be
 * XSS-hardened itself. Matches any `http(s)://` URL in a `src`/`href` — not
 * `https://` only; `CMS_URL` is legitimately plain `http://` in local/dev
 * environments (confirmed live: this project's own E2E fixture CMS runs on
 * `http://localhost:<port>`, and a `https://`-only match silently left every
 * direct-URL rewrite in this function dead there) — and defers the "is this
 * actually CMS-origin" decision entirely to `resolveToMediaProxyPath` (same
 * shared logic `rewriteCmsMediaUrl` uses) rather than only matching a fixed
 * origin string — that's what lets this one pass catch a Photon-wrapped URL
 * too, not just a direct one.
 * @param html The raw WYSIWYG HTML, or `""`/`undefined`.
 * @returns The same markup with every CMS-origin `src`/`href` rewritten to
 * `/api/media/...`; anything not CMS-origin is left untouched.
 */
export const rewriteCmsUrlsInHtml = (html: string | null | undefined): string => {
	if (!html || CMS_ORIGINS.length === 0) return html ?? "";

	return html.replace(
		/(src|href)="(https?:\/\/[^"]*)"/gi,
		(match, attribute: string, url: string) => {
			const resolved = resolveToMediaProxyPath(url);
			return resolved ? `${attribute}="${resolved}"` : match;
		},
	);
};
