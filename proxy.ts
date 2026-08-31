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
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Proxy XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Redirects any request without a locale-prefixed pathname to one — Next 16's
 * renamed `middleware.ts`/`middleware()` convention (confirmed against this
 * repo's own bundled `node_modules/next/dist/docs`: the file/export are
 * renamed to `proxy.ts`/`proxy()` in Next 16, same runtime behavior). Matches
 * Next's own documented locale-routing pattern.
 *
 * Locale is resolved cookie-first (`NEXT_LOCALE`, set by the locale switcher —
 * `components/Global/LocaleSwitcher/LocaleSwitcher.tsx` — on every explicit
 * choice, so it sticks across visits even to a bare, un-prefixed URL), then
 * falls back to the browser's `Accept-Language` header, then `defaultLocale`.
 *
 * A 307 (temporary) redirect, not permanent — a visitor's language preference
 * can change, unlike the HTTPS-enforcing redirect in `next.config.ts`, which is
 * genuinely permanent.
 * @param request The incoming request.
 */
export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const hasLocale = locales.some(
        (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
    );
    if (hasLocale) return;

    const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
    const locale = (cookieLocale && locales.includes(cookieLocale))
        ? cookieLocale
        : getLocaleFromAcceptLanguage(request.headers.get("accept-language")) ?? defaultLocale;

    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;

    return NextResponse.redirect(url, 307);
}

export const config = {
    matcher: [
        // Skip _next internals and any request for a file with an extension
        // (favicon.ico, robots.txt, sitemap.xml, static assets) — none of those
        // are locale-prefixed routes.
        "/((?!_next|.*\\..*).*)",
    ],
};
