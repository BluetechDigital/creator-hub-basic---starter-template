'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import Script from 'next/script';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

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
 * Client-side Google Tag Manager loader. Rendered in `<head>` (see `app/layout.tsx`),
 * it injects the GTM bootstrap script via `next/script` and — because Next.js App
 * Router client-side navigations don't produce a fresh page load for GTM to detect —
 * manually re-fires a `page_view` push into `window.dataLayer` on every pathname/search
 * param change so route changes are still tracked. Renders nothing if
 * `NEXT_PUBLIC_GTM_ID` is unset.
 *
 * For the `<noscript>` fallback rendered alongside it, see {@link GoogleTagManagerNoScript}.
 */
const GoogleTagManager = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // This useEffect handles client-side route changes.
    useEffect(() => {
        // Ensure GTM is configured and dataLayer exists before pushing
        if (GTM_ID && typeof window !== 'undefined' && window.dataLayer) {
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
    }, [pathname, searchParams]);

    if (!GTM_ID) {
        // console.warn("Google Tag Manager ID is not set. GTM will not function.");
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
 * Google's own convention places this fallback immediately after the opening `<body>`
 * tag, but in this project it's rendered in `<head>` alongside {@link GoogleTagManager}
 * (see `app/layout.tsx`). Renders nothing if `NEXT_PUBLIC_GTM_ID` is unset.
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