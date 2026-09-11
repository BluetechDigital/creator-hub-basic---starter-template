import "server-only";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Rewrites CMS-origin media URLs (featured images, SEO OG images, and any
 * `<img>`/`<a href>` inside CMS-authored WYSIWYG HTML — including document
 * links, e.g. a PDF under `/wp-content/uploads/...`) to a same-origin path
 * this app proxies itself (`app/api/media/[...path]/route.ts`), so the CMS's
 * real hostname never appears in anything a visitor's browser renders or can
 * copy — not an `<img src>`, not a "copy link address" on a document, not
 * page source. `import "server-only"` guards against this ever being pulled
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
 */

const CMS_URL: string | undefined = process.env.CMS_URL;
const DEV_CMS_URL: string | undefined = process.env.DEV_CMS_URL;

// Both are checked — which one a given URL actually starts with depends on
// which the live CMS happened to resolve at request time, not on which
// environment this app is currently running in.
const CMS_ORIGINS: string[] = [CMS_URL, DEV_CMS_URL].filter((url): url is string => Boolean(url));

const escapeForRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Single URL fields XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Rewrites one absolute CMS-origin URL (`featuredImage.sourceUrl`,
 * `opengraphImage.mediaItemUrl`, a theme-options `backgroundImage.sourceUrl`,
 * ...) to `/api/media/...`. Anything that isn't CMS-origin — an external
 * image, a Gravatar avatar, a YouTube/Instagram CDN URL — is returned
 * completely unchanged; this only ever touches URLs that actually start with
 * a configured CMS origin.
 * @param url The raw URL as returned by WPGraphQL, or `null`/`undefined`.
 * @returns The rewritten same-origin path, or `url` unchanged if it wasn't
 * CMS-origin (or was empty).
 */
export const rewriteCmsMediaUrl = <T extends string | null | undefined>(url: T): T => {
	if (!url) return url;

	const origin = CMS_ORIGINS.find((candidate) => url.startsWith(candidate));
	if (!origin) return url;

	return `/api/media${url.slice(origin.length)}` as T;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX WYSIWYG HTML string fields XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Rewrites every `src="..."`/`href="..."` attribute pointing at a CMS origin
 * inside a raw WYSIWYG HTML string — a post's `content`/`excerpt`, a
 * TitleParagraph block's `paragraph` field, the error page's
 * `errorPageContent.paragraph`. Catches both embedded images and document
 * links (a PDF a CMS editor linked directly from the media library) in one
 * pass, since both attributes carry the same CMS-origin URL shape.
 *
 * A plain regex over the serialized markup rather than a full DOM
 * parse/rebuild — this runs on WordPress's own generated WYSIWYG output,
 * which reliably double-quotes attribute values, and every render path still
 * sanitizes the result with DOMPurify afterwards regardless of what this pass
 * does to it (`ArticleContent.tsx`, `Paragraph.tsx`), so a pass that's a
 * no-op on malformed markup fails safe rather than needing to be
 * XSS-hardened itself.
 * @param html The raw WYSIWYG HTML, or `""`/`undefined`.
 * @returns The same markup with every CMS-origin `src`/`href` rewritten to
 * `/api/media/...`; anything not CMS-origin is left untouched.
 */
export const rewriteCmsUrlsInHtml = (html: string | null | undefined): string => {
	if (!html || CMS_ORIGINS.length === 0) return html ?? "";

	return CMS_ORIGINS.reduce(
		(markup, origin) =>
			markup.replace(
				new RegExp(`(src|href)="${escapeForRegExp(origin)}([^"]*)"`, "g"),
				(_match, attribute: string, rest: string) => `${attribute}="/api/media${rest}"`,
			),
		html,
	);
};
