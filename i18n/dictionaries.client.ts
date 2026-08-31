/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { locale as localeConst } from "@/context/constants";
import en from "@/i18n/dictionaries/en.json";
import fr from "@/i18n/dictionaries/fr.json";
import de from "@/i18n/dictionaries/de.json";
import es from "@/i18n/dictionaries/es.json";
import it from "@/i18n/dictionaries/it.json";
import pt from "@/i18n/dictionaries/pt.json";
import type { IDictionary } from "@/i18n/dictionaries";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Client Dictionary XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// All six locale JSON files, eagerly bundled — deliberately different from
// `i18n/dictionaries.ts`'s per-locale dynamic `import()`, which only loads
// the *current* request's locale server-side. This file exists for the rare
// case where a Client Component genuinely has no Server Component ancestor
// able to fetch/pass it a `dict` prop — a React error boundary (`error.tsx`)
// can't, since it renders outside the normal Server Component tree and has
// no data-fetching hook of its own. Total footprint across all six files is
// a few KB, negligible for how rarely this path renders (only on a genuine
// runtime error) — not worth the complexity of a dynamic per-locale import
// for a Client Component. No `import "server-only"` here on purpose: this
// file must be importable from a Client Component.
const CLIENT_DICTIONARIES: Record<string, IDictionary> = {
    [localeConst.en]: en,
    [localeConst.fr]: fr,
    [localeConst.de]: de,
    [localeConst.es]: es,
    [localeConst.it]: it,
    [localeConst.pt]: pt,
};

/**
 * Synchronous, Client-Component-safe equivalent of `i18n/dictionaries.ts`'s
 * `getDictionary()` — same fallback-to-English behavior for an unrecognized
 * locale, but no `Promise`/dynamic `import()`, since every locale is already
 * in memory here. Prefer `getDictionary()` from a Server Component; reach for
 * this only where a Client Component truly has no way to receive a `dict`
 * prop instead (see this file's own doc comment above).
 * @param locale One of this project's supported locale codes.
 */
export const getClientDictionary = (locale: string): IDictionary =>
    CLIENT_DICTIONARIES[locale] ?? CLIENT_DICTIONARIES[localeConst.en];
