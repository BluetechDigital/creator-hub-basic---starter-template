/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { locales, defaultLocale } from "@/context/constants";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Accept-Language Parsing XXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Picks the best supported locale from a raw `Accept-Language` header value —
 * hand-rolled rather than pulling in `@formatjs/intl-localematcher`/`negotiator`
 * (the dependency Next's own i18n guide's example uses), since this project's
 * fixed 6 non-regional locale codes (`en`/`fr`/`de`/`es`/`it`/`pt`, no `en-US` vs
 * `en-GB` disambiguation to resolve) don't need full BCP-47 quality-matching —
 * every other integration in this codebase is a hand-rolled, zero-dependency
 * `fetch` call, and this follows the same convention.
 *
 * `Accept-Language` looks like `"fr-FR,fr;q=0.9,en;q=0.8"` — entries in
 * preference order, each optionally carrying a `;q=` weight this function
 * ignores (order already reflects preference) and a region subtag this
 * function also ignores (`fr-FR` and `fr` are both just `fr` here).
 * @param header The raw `Accept-Language` request header value, or `null`.
 * @returns The first supported locale found, or `undefined` if none match.
 */
const getLocaleFromAcceptLanguage = (header: string | null): string | undefined => {
    if (!header) return undefined;

    const preferred = header
        .split(",")
        .map((entry) => entry.split(";")[0].trim().split("-")[0].toLowerCase());

    return preferred.find((lang) => locales.includes(lang));
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Content-Security-Policy XXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// `'unsafe-eval'` is only needed by Next's dev/HMR runtime — never ship it.
const cspAllowUnsafeEval = process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : "";

/**
 * Builds this request's `Content-Security-Policy` header value around a
 * fresh, single-use nonce. This has to live here rather than as a static
 * value in `next.config.ts` (where every other security header still lives —
 * this is the one exception) because a nonce is only meaningful if it's
 * unpredictable and different on every request; a value baked into config at
 * build/start time would be the same nonce for every visitor forever, which
 * defeats the entire point (see Next's own guide,
 * `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`).
 *
 * `script-src` carries `'nonce-<value>'` + `'strict-dynamic'` instead of
 * `'unsafe-inline'`: only a `<script>` tag that actually carries this
 * request's nonce (`components/Global/StructuredData/StructuredData.tsx`'s
 * JSON-LD tags, `components/Global/Analytics/GoogleTagManager.tsx`'s GTM
 * bootstrap — Next.js nonces its own framework/hydration scripts
 * automatically once it detects a nonce in this header, nothing extra needed
 * for those) is allowed to run; a reflected/injected `<script>` an attacker
 * got into the page has no way to know the nonce and won't execute.
 * `'strict-dynamic'` lets a trusted, nonced script (GTM's bootstrap) load
 * further scripts of its own (the actual `gtm.js`, and whatever that loads)
 * without every downstream host needing to be enumerated — browsers that
 * don't understand `'strict-dynamic'` simply ignore it and fall back to the
 * explicit host list kept alongside it, so both are listed together
 * deliberately, not redundantly.
 *
 * Every other directive is unchanged from what `next.config.ts` used to hold
 * — see this project's ARCHITECTURE.md if that changes and this comment
 * needs revisiting.
 * @param nonce This request's single-use nonce.
 */
const buildCspHeader = (nonce: string): string => `
    default-src 'self';
    img-src 'self' ${process.env.CMS_URL} ${process.env.IMAGE_REMOTE_PATTERNS_HOSTNAME_ONE} ${process.env.IMAGE_REMOTE_PATTERNS_HOSTNAME_TWO} ${process.env.YOUTUBE_IMAGE_REMOTE_PATTERNS_HOSTNAME} ${process.env.INSTAGRAM_IMAGE_REMOTE_PATTERNS_HOSTNAME} ${process.env.INSTAGRAM_IMAGE_REMOTE_PATTERNS_HOSTNAME_TWO} https://secure.gravatar.com https://www.googletagmanager.com https://www.google-analytics.com data:;
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://www.googletagmanager.com https://www.google.com https://www.gstatic.com${cspAllowUnsafeEval};
    style-src 'self' 'unsafe-inline';
    connect-src 'self' ${process.env.CMS_URL} https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com https://www.google.com;
    frame-src 'self' ${process.env.YOUTUBE_EMBED_REMOTE_PATTERNS_HOSTNAME} https://www.googletagmanager.com https://www.google.com;
    object-src 'none';
    base-uri 'none';
    form-action 'self';
    frame-ancestors 'none';`
    .replace(/\s{2,}/g, " ")
    .trim();

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Proxy XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Redirects any request without a locale-prefixed pathname to one — Next 16's
 * renamed `middleware.ts`/`middleware()` convention (confirmed against this
 * repo's own bundled `node_modules/next/dist/docs`: the file/export are
 * renamed to `proxy.ts`/`proxy()` in Next 16, same runtime behavior). Matches
 * Next's own documented locale-routing pattern. Also generates this request's
 * CSP nonce (see `buildCspHeader` above) and attaches it two ways: as the
 * `Content-Security-Policy` response header (what the browser enforces
 * against), and as an `x-nonce` request header forwarded on to the actual
 * page render — that's how a Server Component downstream (`StructuredData`,
 * or `app/[locale]/layout.tsx` for `GoogleTagManager`) reads the *same* nonce
 * value back out via `headers()` to put on its own `<script>` tags, rather
 * than each generating an unrelated one of its own.
 *
 * Locale is resolved cookie-first (`NEXT_LOCALE`, set by the locale switcher —
 * `components/Global/LocaleSwitcher/LocaleSwitcher.tsx` — on every explicit
 * choice, so it sticks across visits even to a bare, un-prefixed URL), then
 * falls back to the browser's `Accept-Language` header, then `defaultLocale`.
 *
 * A 307 (temporary) redirect, not permanent — a visitor's language preference
 * can change, unlike the HTTPS-enforcing redirect in `next.config.ts`, which is
 * genuinely permanent. The nonce/CSP set on a redirect response itself is
 * inert (a 307 has no body to run a script in) but harmless to include — it
 * keeps this to one code path instead of two, and the browser's follow-up
 * request to the resolved locale URL runs `proxy()` again and gets its own
 * fresh nonce for the page that's actually rendered.
 * @param request The incoming request.
 */
export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
    const cspHeader = buildCspHeader(nonce);

    const hasLocale = locales.some(
        (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
    );

    let response: NextResponse;

    if (hasLocale) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-nonce", nonce);
        response = NextResponse.next({ request: { headers: requestHeaders } });
    } else {
        const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
        const locale = (cookieLocale && locales.includes(cookieLocale))
            ? cookieLocale
            : getLocaleFromAcceptLanguage(request.headers.get("accept-language")) ?? defaultLocale;

        const url = request.nextUrl.clone();
        url.pathname = `/${locale}${pathname}`;

        response = NextResponse.redirect(url, 307);
    }

    response.headers.set("Content-Security-Policy", cspHeader);
    return response;
}

export const config = {
    matcher: [
        // Skip _next internals, API routes (no locale concept, and no HTML
        // response for a CSP to matter on — confirmed live this was actually
        // missing before: without it, a request like /api/instagram/refresh-token
        // fell through to the locale-redirect logic below and got 307'd to
        // /en/api/instagram/refresh-token, a route that doesn't exist — the
        // weekly Instagram-token-refresh cron would have silently 404'd), and
        // any request for a file with an extension (favicon.ico, robots.txt,
        // sitemap.xml, static assets, the /api/media proxy's own responses) —
        // none of those are locale-prefixed routes.
        "/((?!_next|api|.*\\..*).*)",
    ],
};
