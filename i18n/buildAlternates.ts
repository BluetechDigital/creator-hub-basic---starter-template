/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { locales } from "@/context/constants";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const SITE_URL: string | undefined = process.env.SITE_URL;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX Build Locale Alternates XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Builds `generateMetadata`'s `alternates` (canonical + hreflang) for a
 * locale-prefixed route. Every route now lives under `app/[locale]/`, so
 * WPGraphQL's/Yoast's own `seo.canonical`/`seo.opengraphUrl` values (computed
 * with no locale segment) can't be trusted directly here the way they could
 * before this feature — they'd point at the un-prefixed URL, which is now a
 * different page (a `proxy.ts` redirect target) rather than this one.
 *
 * `languages` includes an `x-default` entry pointing at the un-prefixed
 * (English) URL, per Google's hreflang guidance — the version to serve a
 * visitor whose locale doesn't match any of this site's supported ones.
 * @param locale The current route's locale.
 * @param pathWithoutLocale The route's path *below* the locale segment,
 * including a leading slash (e.g. `/posts/some-post`, or `''` for the home
 * page — never including the locale itself).
 * A concrete, non-nullable return type (rather than reusing the broader
 * `Metadata["alternates"]`, which allows `null`/`undefined` and looser field
 * types) so callers — `generateMetadata` implementations and `app/sitemap.ts`
 * alike — can destructure `canonical`/`languages` directly without a null
 * check; a narrower object type is still assignable everywhere
 * `Metadata["alternates"]` is expected.
 * @returns `{ canonical, languages }`, ready to spread into `generateMetadata`'s
 * returned object, or to pull `canonical`/`languages` out of directly (as
 * `app/sitemap.ts` does for a sitemap entry's `url`/`alternates.languages`).
 */
export const buildLocaleAlternates = (
    locale: string,
    pathWithoutLocale: string,
): { canonical: string; languages: Record<string, string> } => ({
    canonical: `${SITE_URL}/${locale}${pathWithoutLocale}`,
    languages: {
        ...Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}${pathWithoutLocale}`])),
        "x-default": `${SITE_URL}${pathWithoutLocale}`,
    },
});
