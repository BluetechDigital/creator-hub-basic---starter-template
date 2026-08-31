'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, localeLabels } from "@/context/constants";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/Global/LocaleSwitcher/styles/LocaleSwitcher.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type ILocaleSwitcher = {
    /** The current route's locale — read via `getLocale()` in `app/[locale]/layout.tsx`
     * (a Server Component) and passed down, since a Client Component can't call that
     * itself. */
    currentLocale: string;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Configuration XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const NEXT_LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX LocaleSwitcher Component XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders a link per supported locale (native-language labels — "Français",
 * not "French" — from `context/constants.ts`'s `localeLabels`), each pointing
 * at the *current* page re-based under that locale, not the home page —
 * `pathname` always starts with `/{currentLocale}` (every route lives under
 * `app/[locale]/`), so stripping just that leading segment and re-prefixing it
 * with the target locale preserves whatever page/query the visitor is
 * actually on.
 *
 * Sets the `NEXT_LOCALE` cookie on click (read by `proxy.ts`) so an explicit
 * choice sticks across a future visit to a bare, un-prefixed URL, not just for
 * this one navigation.
 *
 * `'use client'` — needs `usePathname()`, which is client-only. Rendered from
 * `app/[locale]/layout.tsx`; no Navbar exists yet in this starter to host it
 * inside (confirmed via a full repo search), so its exact page placement is a
 * decision for whoever builds one, not assumed here.
 */
const LocaleSwitcher: FC<ILocaleSwitcher> = ({ currentLocale }) => {

    const pathname = usePathname();
    const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/';

    return (
        <nav aria-label="Language" className={styles.localeSwitcher}>
            {locales.map((locale) => (
                <Link
                    key={locale}
                    href={`/${locale}${pathWithoutLocale}`}
                    onClick={() => {
                        document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${NEXT_LOCALE_COOKIE_MAX_AGE}`;
                    }}
                    aria-current={locale === currentLocale ? 'true' : undefined}
                    className={locale === currentLocale ? styles.localeLinkActive : styles.localeLink}
                >
                    {localeLabels[locale]}
                </Link>
            ))}
        </nav>
    );
};

LocaleSwitcher.displayName = 'LocaleSwitcher';

export default LocaleSwitcher;
