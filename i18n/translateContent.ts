/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { getLocale } from "@/i18n/getLocale";
import { getTranslatedContent } from "@/api/Translation/GetTranslatedContent";
import { locale as localeConst } from "@/context/constants";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Translate Fields XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Translates a flat record of English string fields into the current request's
 * locale, read internally via `getLocale()` — callers never thread `locale`
 * through as an argument. A no-op for the default locale (`'en'`): the CMS
 * source of truth already is English, so this is where every English page load
 * is kept from paying for a translation call whose result would be discarded,
 * rather than requiring every call site to remember that check itself.
 *
 * Deliberately a wrapping layer over the existing `graphql/CMS/*.ts` fetchers,
 * not built into them — a caller fetches English content exactly as before,
 * then pipes the result through this function. Keeps those fetchers doing
 * exactly one job (fetch English content) and keeps every existing
 * `graphql/CMS/*.test.ts` file unchanged, since translation never happens
 * inside them.
 *
 * Batches every field into at most two Azure calls (one for plain-text fields,
 * one for HTML fields, run in parallel) rather than one call per field — see
 * `getTranslatedContent`'s own doc comment for why batching matters. Falsy
 * fields (`null`/`undefined`/`''`) are skipped entirely before batching, so an
 * ACF field that's legitimately empty doesn't round-trip through Azure as an
 * empty string.
 * @param fields Plain-text/HTML string fields to translate, keyed by field name.
 * @param htmlFieldNames Which keys in `fields` hold raw HTML (e.g. a WordPress
 * post's `content` field) — selects Azure's `textType=html` mode per field,
 * since a single object can mix a plain-text title with an HTML body.
 * @returns `fields` unchanged for the default locale; otherwise the same shape
 * with every non-empty value replaced by its translation.
 */
export const translateFields = async <T extends Record<string, string | null | undefined>>(
    fields: T,
    htmlFieldNames: (keyof T)[] = [],
): Promise<T> => {
    const currentLocale = await getLocale();

    if (currentLocale === localeConst.en) {
        return fields;
    }

    const entries = Object.entries(fields).filter(([, value]) => Boolean(value)) as [keyof T, string][];
    const plainEntries = entries.filter(([key]) => !htmlFieldNames.includes(key));
    const htmlEntries = entries.filter(([key]) => htmlFieldNames.includes(key));

    const [plainTranslated, htmlTranslated] = await Promise.all([
        plainEntries.length ? getTranslatedContent(plainEntries.map(([, value]) => value), currentLocale, false) : [],
        htmlEntries.length ? getTranslatedContent(htmlEntries.map(([, value]) => value), currentLocale, true) : [],
    ]);

    const result = { ...fields };
    plainEntries.forEach(([key], index) => { result[key] = plainTranslated[index] as T[keyof T]; });
    htmlEntries.forEach(([key], index) => { result[key] = htmlTranslated[index] as T[keyof T]; });

    return result;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Translate Post Summaries XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// The subset of a post summary's fields this project translates — kept narrow
// and explicit (title + excerpt only) rather than translating every string
// field on a summary, since fields like `slug` must never be translated (they
// identify the underlying WPGraphQL query, not display text — see this file's
// sibling call sites for the "filter values must stay English" rule this
// mirrors).
export type ITranslatableSummary = {
    title: string;
    excerpt: string;
};

/**
 * Translates `title`/`excerpt` across a whole list of post summaries (an
 * archive page's worth) in one Azure call each, rather than one call per post
 * — the same batching rationale as `translateFields`, applied across a list
 * instead of within a single object's fields. A no-op for the default locale.
 * @param posts Post summaries to translate — only `title`/`excerpt` are read;
 * every other field on each item passes through unchanged.
 * @returns A new array, same length/order as `posts`, with `title`/`excerpt`
 * replaced by their translations (or unchanged for the default locale).
 */
export const translatePostSummaries = async <T extends ITranslatableSummary>(
    posts: T[],
): Promise<T[]> => {
    const currentLocale = await getLocale();

    if (currentLocale === localeConst.en || !posts.length) {
        return posts;
    }

    const titles = posts.map((post) => post.title);
    const excerpts = posts.map((post) => post.excerpt);

    const [translatedTitles, translatedExcerpts] = await Promise.all([
        getTranslatedContent(titles, currentLocale, false),
        getTranslatedContent(excerpts, currentLocale, false),
    ]);

    return posts.map((post, index) => ({
        ...post,
        title: translatedTitles[index] ?? post.title,
        excerpt: translatedExcerpts[index] ?? post.excerpt,
    }));
};
