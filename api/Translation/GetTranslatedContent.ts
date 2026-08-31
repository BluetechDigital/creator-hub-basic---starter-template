/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const AZURE_TRANSLATOR_KEY: string | undefined = process.env.AZURE_TRANSLATOR_KEY;
const AZURE_TRANSLATOR_REGION: string | undefined = process.env.AZURE_TRANSLATOR_REGION;
const AZURE_TRANSLATOR_ENDPOINT: string | undefined = process.env.AZURE_TRANSLATOR_ENDPOINT;
// Translated text is strictly more stable than its English source — a source edit
// changes the request body (the actual strings sent), which is itself a fresh cache
// key under Next's fetch cache, so a longer window than the 24h used for the English
// WPGraphQL fetches doesn't risk serving a stale translation of *changed* content.
const TRANSLATION_REVALIDATE_TIME = 604800; // 7 Days

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Raw shape of one entry in Azure Translator's /translate response array.
type IRawTranslationEntry = {
    translations: { text: string; to: string }[];
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Translate Content XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Translates a batch of strings into a single target locale via Microsoft Azure
 * AI Translator's REST API (`/translate`). Every string is sent in one `POST`
 * request rather than one call per string — Azure's array-body endpoint accepts
 * up to 100 elements per call, and batching collapses what could be dozens of
 * round-trips (a single archive page's worth of post titles/excerpts) into one,
 * which also means the whole batch shares a single Next `fetch` cache entry.
 *
 * `isHtml` selects Azure's `textType=html` mode, which parses the string as HTML
 * and only translates its text nodes, leaving tags/attributes untouched — set
 * this only for fields that are genuinely raw HTML (the WordPress post `content`
 * field). Every other field (titles, excerpts, ACF plain-text values, SEO
 * strings) should use the default `plain` mode: running `html` mode on a plain
 * string is harmless, but running `plain` mode on real HTML would translate tag
 * names/attribute text and corrupt the markup.
 *
 * Auth is two static headers (`Ocp-Apim-Subscription-Key`/`-Region`) — no OAuth
 * token exchange needed, simpler than `api/Spotify/GetAllSpotifyContent.ts`'s
 * client-credentials flow, which is the closest other precedent in this codebase
 * for a header-authenticated (rather than query-string-key) external API.
 * @param texts Strings to translate, in source order — the response preserves
 * this order, so callers can zip it back against whatever they built `texts` from.
 * @param targetLocale One of this project's supported locale codes. Never call
 * this for the default locale ('en') — the CMS source of truth already is
 * English, so translating English to English would be a pure-cost no-op; see
 * `i18n/translateContent.ts`'s `translateFields`, which enforces this.
 * @param isHtml Whether `texts` holds raw HTML rather than plain text. Defaults
 * to `false`.
 * @returns Translated strings, same order and length as `texts`. Empty array
 * (no request made) if `texts` is empty.
 */
export const getTranslatedContent = async (
    texts: string[],
    targetLocale: string,
    isHtml: boolean = false,
): Promise<string[]> => {
    // 1. Defensive Checks
    if (!AZURE_TRANSLATOR_KEY || !AZURE_TRANSLATOR_REGION || !AZURE_TRANSLATOR_ENDPOINT) {
        throw new Error("Missing Azure Translator environment variables (AZURE_TRANSLATOR_KEY, AZURE_TRANSLATOR_REGION, or AZURE_TRANSLATOR_ENDPOINT).");
    }

    if (!texts.length) {
        return [];
    }

    try {
        const textType = isHtml ? "html" : "plain";
        const url = `${AZURE_TRANSLATOR_ENDPOINT}/translate?api-version=3.0&to=${targetLocale}&textType=${textType}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Ocp-Apim-Subscription-Key": AZURE_TRANSLATOR_KEY,
                "Ocp-Apim-Subscription-Region": AZURE_TRANSLATOR_REGION,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(texts.map((text) => ({ Text: text }))),
            next: { revalidate: TRANSLATION_REVALIDATE_TIME },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Azure Translator API Error (${response.status}): ${errorData?.error?.message || 'Failed to translate content.'}`);
        }

        const data = await response.json() as IRawTranslationEntry[];

        return data.map((entry) => entry.translations[0]?.text ?? "");

    } catch (error: unknown) {
        console.error(`Error translating content to "${targetLocale}":`, error);
        throw new Error("Failed to translate content");
    }
};
