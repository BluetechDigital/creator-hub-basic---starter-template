'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import Link from "next/link";
import Image from "next/image";
import { FC, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { locales, localeLabels } from "@/context/constants";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/Global/LocaleSwitcher/styles/LocaleSwitcher.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX Props / Configuration XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type ILocaleSwitcher = {
    /** The current route's locale — read via `getLocale()` in `app/[locale]/layout.tsx`
     * (a Server Component) and passed down, since a Client Component can't call that
     * itself. */
    currentLocale: string;
    /** Optional extra class on the root — e.g. once a Navbar exists, a mobile-drawer
     * variant placed inline rather than as a floating dropdown. */
    className?: string;
};

// Which flag SVG (in `public/svg/flags/`) represents each locale.
const LOCALE_FLAG: Record<string, string> = {
    en: "/svg/flags/gb.svg",
    fr: "/svg/flags/fr.svg",
    de: "/svg/flags/de.svg",
    es: "/svg/flags/es.svg",
    it: "/svg/flags/it.svg",
    pt: "/svg/flags/pt.svg",
};

const NEXT_LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX Flag XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/** A locale's flag in a fixed rounded chip. `unoptimized` — the sources are
 * trusted first-party SVGs, so skip the image optimizer (which rejects SVG). */
const Flag: FC<{ locale: string }> = ({ locale }) => (
    <span className={styles.localeSwitcherFlag}>
        <Image
            unoptimized
            width={60}
            height={30}
            src={LOCALE_FLAG[locale] ?? LOCALE_FLAG.en}
            alt={`${localeLabels[locale] ?? locale} flag`}
        />
    </span>
);

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX LocaleSwitcher Component XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Flag dropdown — the trigger shows only the current locale's flag; opening it
 * lists every supported locale as flag + native label (`localeLabels` —
 * "Italiano", not "Italian"), each a link to the *current* page re-based under
 * that locale. `pathname` always starts with `/{currentLocale}` (every route
 * lives under `app/[locale]/`), so stripping just that leading segment and
 * re-prefixing it with the target locale preserves whatever page/query the
 * visitor is actually on.
 *
 * Sets the `NEXT_LOCALE` cookie on click (read by `proxy.ts`) so an explicit
 * choice sticks across a future visit to a bare, un-prefixed URL, not just for
 * this one navigation.
 *
 * `'use client'` — needs `usePathname()` and open/close state. Rendered from
 * `app/[locale]/layout.tsx`; no Navbar exists yet in this starter to host it
 * inside (confirmed via a full repo search), so it renders as a
 * self-contained floating dropdown — its exact page placement is a decision
 * for whoever builds real site chrome, not assumed here.
 */
const LocaleSwitcher: FC<ILocaleSwitcher> = ({ currentLocale, className }) => {

    const pathname = usePathname();
    const pathWithoutLocale = pathname.replace(new RegExp(`^/${currentLocale}(?=/|$)`), "") || "/";

    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    // Close on outside click / Escape.
    useEffect(() => {
        if (!open) return;

        const onPointerDown = (event: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false);
        };

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    const chooseLocale = (locale: string) => {
        // Persist the explicit choice for `proxy.ts` to read on a later visit to a
        // bare URL. `document.cookie` assignment is an append-a-cookie operation,
        // not a reassignment — the immutability lint rule can't tell the difference.
        /* eslint-disable-next-line react-hooks/immutability */
        document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${NEXT_LOCALE_COOKIE_MAX_AGE}`;
        setOpen(false);
    };

    return (
        <div ref={rootRef} className={`${styles.localeSwitcher}${className ? ` ${className}` : ""}`}>
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={`Change language — current: ${localeLabels[currentLocale] ?? currentLocale}`}
                className={styles.localeSwitcherTrigger}
            >
                <Flag locale={currentLocale} />
                <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.localeSwitcherChevron}>
                    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            <AnimatePresence>
                {open ? (
                    <motion.ul
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        role="listbox"
                        className={styles.localeSwitcherMenu}
                    >
                        {locales.map((locale) => (
                            <li key={locale} role="option" aria-selected={locale === currentLocale}>
                                <Link
                                    prefetch={false}
                                    href={`/${locale}${pathWithoutLocale}`}
                                    onClick={() => chooseLocale(locale)}
                                    aria-current={locale === currentLocale ? "true" : undefined}
                                    className={
                                        locale === currentLocale
                                            ? styles.localeSwitcherItemActive
                                            : styles.localeSwitcherItem
                                    }
                                >
                                    <Flag locale={locale} />
                                    <span>{localeLabels[locale] ?? locale}</span>
                                </Link>
                            </li>
                        ))}
                    </motion.ul>
                ) : null}
            </AnimatePresence>
        </div>
    );
};

LocaleSwitcher.displayName = 'LocaleSwitcher';

export default LocaleSwitcher;
