'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import Script from 'next/script';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import useCookiePolicy from '@/context/cookies';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const GTM_ID: string | undefined = process.env.NEXT_PUBLIC_GTM_ID;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXX Extend the Window interface to include dataLayer XXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXX Google Tag Manager Component XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Client-side Google Tag Manager loader. Rendered inside `CookiePolicyContextProvider`
 * in `app/layout.tsx` (not in `<head>` — `next/script`'s `afterInteractive` strategy
 * doesn't require literal `<head>` placement, and being a provider descendant is what
 * lets this component read consent state) so it never loads before consent, it injects
 * the GTM bootstrap script via `next/script` and — because Next.js App Router
 * client-side navigations don't produce a fresh page load for GTM to detect — manually
 * re-fires a `page_view` push into `window.dataLayer` on every pathname/search param
 * change so route changes are still tracked.
 *
 * Renders nothing (and pushes nothing) until both `NEXT_PUBLIC_GTM_ID` is set AND the
 * visitor has explicitly accepted cookies via `useCookiePolicy()` — `hasConsent` starts
 * `null` (no decision yet) and only becomes `true` on accept, so no tracking script
 * loads before consent is given, and none loads at all if declined. Consuming that
 * context here means this component re-renders (and the script mounts) the moment
 * consent is granted, with no extra plumbing needed.
 *
 * For the `<noscript>` fallback rendered alongside it, see {@link GoogleTagManagerNoScript}
 * — that one is intentionally NOT consent-gated the same way, since a visitor without
 * JavaScript can never see or interact with the cookie-consent banner in the first
 * place (it's a React component); gating it accurately would require reading the
 * consent cookie server-side, which would force this entire app out of static
 * rendering. Left as a known limitation rather than solved here.
 */
const GoogleTagManager = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { hasConsent } = useCookiePolicy();

    // This useEffect handles client-side route changes.
    useEffect(() => {
        if (GTM_ID && hasConsent && window.dataLayer) {
            // Construct the full path with search parameters
            const search = searchParams.toString();
            const path = pathname + (search ? `?${search}` : '');

            window.dataLayer.push({
                event: 'page_view',
                page_path: path,
                // Add a source property for clarity/debugging in GTM
                page_source: 'nextjs_app_router',
            });
        }
    }, [pathname, searchParams, hasConsent]);

    if (!GTM_ID || !hasConsent) {
        return null;
    }

    // GTM Script Injection
    return (
        <Script
            id="gtm-script"
            strategy="afterInteractive" // Load this script after the page is interactive.
            dangerouslySetInnerHTML={{
                __html: `
                    window.dataLayer = window.dataLayer || []; // Ensure dataLayer is initialized
                    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                    })(window,document,'script','dataLayer','${GTM_ID}');
                `,
            }}
        />
    );
};

/* -----------------------------------------------------------------------------
XXXXXXXXXX NoScript version for browsers with JavaScript disabled XXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * `<noscript>` fallback for Google Tag Manager: an invisible tracking iframe for
 * visitors with JavaScript disabled, who never run the script-based tracker above.
 * Rendered immediately after the opening `<body>` tag in `app/layout.tsx`, matching
 * Google's own placement convention — unlike {@link GoogleTagManager}, it isn't nested
 * inside `CookiePolicyContextProvider` (see that component's doc comment for why it
 * isn't consent-gated the same way). Renders nothing if `NEXT_PUBLIC_GTM_ID` is unset.
 */
export const GoogleTagManagerNoScript = () => {
    if (!GTM_ID) return null;
    
    return (
        <noscript>
            <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
                height="0"
                width="0"
                style={{ display: 'none', visibility: 'hidden' }}
            />
        </noscript>
    );
}

GoogleTagManager.displayName = 'GoogleTagManager';

export default GoogleTagManager;