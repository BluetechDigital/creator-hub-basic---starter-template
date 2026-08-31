/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { locale as getRootLocale } from "next/root-params";
import { notFound } from "next/navigation";
import { locales } from "@/context/constants";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Get Locale XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Reads the current request's locale from the `app/[locale]/` root segment via
 * `next/root-params` — the tool Next's own docs specifically recommend for a
 * value like this one that's needed deep in shared server-side utilities
 * (every `i18n/` and `graphql/CMS/` translation call site), rather than
 * prop-drilling `locale` through every layer the way `filters`/`page` already
 * are in `RenderFlexibleContent.tsx` for their narrower, single-block needs.
 *
 * Server Components/server-side utilities only — `next/root-params` throws at
 * build time if imported into a Client Component, and throws at runtime inside
 * `unstable_cache` (this repo's one user of that, `GetPostFilterOptions.ts`,
 * would need locale passed in as an explicit argument instead if it's ever
 * made locale-aware).
 *
 * Every route in this app lives under `app/[locale]/`, so `locale()` resolving
 * to `undefined` (Next's documented behavior for a root param absent from the
 * current route's root layout) should be structurally unreachable here — and
 * `proxy.ts` guarantees every request already carries a valid, supported
 * locale segment before this ever runs. Both branches below are genuinely
 * defensive, not expected in normal operation: `notFound()` rather than a
 * silent fallback, since either case means something upstream is already
 * broken and papering over it would hide that.
 * @returns The current locale, guaranteed to be one of `locales`.
 */
export const getLocale = async (): Promise<string> => {
    const value = await getRootLocale();

    if (!value || !locales.includes(value)) {
        notFound();
    }

    return value;
};
