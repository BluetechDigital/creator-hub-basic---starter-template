/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import "server-only";
import { locale as localeConst } from "@/context/constants";
import en from "@/i18n/dictionaries/en.json";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Dictionary XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// The static UI-string dictionary shape, inferred once from the English source
// of truth — every other locale's JSON is checked against this same shape at
// import time (a locale file missing a key, or misspelling one, is a build-time
// type error here rather than a silently-blank string in production).
export type IDictionary = typeof en;

const dictionaries: Record<string, () => Promise<IDictionary>> = {
    [localeConst.en]: () => Promise.resolve(en),
    [localeConst.fr]: () => import("@/i18n/dictionaries/fr.json").then((m) => m.default),
    [localeConst.de]: () => import("@/i18n/dictionaries/de.json").then((m) => m.default),
    [localeConst.es]: () => import("@/i18n/dictionaries/es.json").then((m) => m.default),
    [localeConst.it]: () => import("@/i18n/dictionaries/it.json").then((m) => m.default),
    [localeConst.pt]: () => import("@/i18n/dictionaries/pt.json").then((m) => m.default),
};

/**
 * Loads the static UI-string dictionary for a locale — Next's own documented
 * `getDictionary()` pattern (`node_modules/next/dist/docs/01-app/02-guides/
 * internationalization.md`). `import "server-only"` enforces at build time
 * that this can never end up in a Client Component's bundle; components that
 * need these strings but are themselves Client Components (`CookiePolicy.tsx`,
 * `PostFilters.tsx`, `VideosGrid.tsx`, `Pagination.tsx`, `VideoCard.tsx`) get
 * the relevant slice passed down as a `dict` prop from their nearest Server
 * Component ancestor instead — identical in shape to how `filters`/`page` are
 * already threaded through `RenderFlexibleContent.tsx` today.
 *
 * This covers only the static, non-CMS UI chrome inventoried this session
 * (filters, pagination, empty states, the cookie banner, breadcrumbs) — CMS
 * content (post titles/excerpts/body, SEO text) is translated dynamically via
 * `i18n/translateContent.ts` instead, never through this static dictionary.
 * @param locale One of this project's supported locale codes.
 * @returns The dictionary for that locale, falling back to English for an
 * unrecognized value rather than throwing — a missing/garbled locale here
 * shouldn't crash the whole page over what's ultimately just label text.
 */
export const getDictionary = async (locale: string): Promise<IDictionary> => {
    const load = dictionaries[locale] ?? dictionaries[localeConst.en];
    return load();
};

// Re-exported for Server Component callers already importing from this file —
// see `i18n/formatTemplate.ts`'s own doc comment for why the real definition
// lives there instead (Client Components need to import it directly from that
// file, not this one, since this file's `import "server-only"` above poisons
// the whole module for client bundling).
export { formatTemplate } from "@/i18n/formatTemplate";
