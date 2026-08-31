/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import type { Metadata } from "next";
import { Suspense, ReactNode, JSX } from 'react';

// Global CSS
import "@/styles/globals.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXX Global Context Provider Types XXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IGlobal from "@/context/types/global";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX CMS Query Functions XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Menu Links
import { 
	getAllMobileLinks,
	getAllCopyrightLinks,
	getAllNavbarMenuLinks,
	getAllFooterMenuLinks,
} from "@/graphql/CMS/GetAllMenuLinks";

// Themes Options
import { getThemesOptionsContent } from "@/graphql/CMS/GetAllThemesOptions";

// Static UI Dictionary
import { getDictionary } from "@/i18n/dictionaries";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Context Providers Components
import GlobalContextProvider from "@/context/providers/GlobalContextProvider";
import CookiePolicyContextProvider from "@/context/providers/CookiePolicyContextProvider";

// Vercel Analytics & Speed Insights
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Page Transition Component
import PixelatedWavePageTransition from "@/components/Global/PageTransition/PixelatedWave/PixelatedWave";

// Other Components
import SmoothScrolling from "@/components/Global/SmoothScrolling";
import CookiePolicy from "@/components/Global/CookiePolicy/CookiePolicy";
import LocaleSwitcher from "@/components/Global/LocaleSwitcher/LocaleSwitcher";
import ChangePageTitleOnLeave from "@/components/Global/Gimmicks/ChangePageTitleOnLeave";
import BlurryCursorMouse from "@/components/Global/Gimmicks/BlurryCursorMouse/BlurryCursorMouse";
import GoogleTagManager, { GoogleTagManagerNoScript } from "@/components/Global/Analytics/GoogleTagManager";

// Structured Data (JSON-LD)
import StructuredData from "@/components/Global/StructuredData/StructuredData";
import { buildPersonSchema, buildWebsiteSchema } from "@/components/Global/StructuredData/builders";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const SITE_NAME: string | undefined = process.env.SITE_NAME;
const SITE_URL: string | undefined = process.env.SITE_URL;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Metadata XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export const metadata: Metadata = {
  title: {
    default: SITE_NAME!,
    template: `%s | ${SITE_NAME}`,
  },
  description: "A starter template for Creator Hub built with Next.js, Tailwind CSS, and TypeScript.",
  robots: {
    follow: true,
    index: true
  }
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Root Layout Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Root layout for every route. Fetches site-wide CMS content (theme options plus
 * mobile/copyright/navbar/footer menu links) once here via `Promise.all` — since none of
 * these queries depend on each other's results, running them in parallel avoids a
 * sequential chain of network round-trips — then assembles them into `globalProps`
 * (typed as `IGlobal.IProps`) for `GlobalContextProvider`.
 *
 * Provider nesting order below is significant: `CookiePolicyContextProvider` is
 * outermost so `CookiePolicyContext` is available to everything nested inside it,
 * including the `CookiePolicy` banner rendered further down inside `SmoothScrolling`
 * and — just as importantly — `GoogleTagManager`, which reads consent from that same
 * context to avoid loading its tracking script before the visitor has accepted;
 * `GlobalContextProvider` wraps `SmoothScrolling` (and therefore `children` and
 * `CookiePolicy`) so global content is available to the page content and the rest of the
 * tree. Reordering these would make global content or cookie-consent state unavailable
 * to the components that currently depend on reading it from context.
 *
 * `locale` is read directly from this layout's own `params` (not
 * `next/root-params` — that's for reading it *below* the layout that owns the
 * segment; this layout *is* that owner, so the regular `params` prop is the
 * right tool here) and used for `<html lang>` and the static UI dictionary —
 * see `i18n/dictionaries.ts`. `CookiePolicy` and `LocaleSwitcher` are Client
 * Components, so the relevant dictionary slice/locale is passed down as a
 * prop rather than read internally.
 * @param children - The routed page content.
 * @param params - Route params promise; resolves to `{locale}`.
 */
const RootLayout = async ({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }): Promise<JSX.Element> => {

  const { locale } = await params;

  /* PUBLIC PAGES  */
  const promises: Promise<unknown>[] = [
    // Custom Post Types
		getThemesOptionsContent(),

		// Website Links
		getAllMobileLinks(),
		getAllCopyrightLinks(),
		getAllNavbarMenuLinks(),
		getAllFooterMenuLinks(),

		// Static UI Dictionary
		getDictionary(locale),

	];

  // Await all promises to resolve
	const [
		themesOptionsContent,

		// Website Links
		mobileLinks,
		copyrightLinks,
		navbarMenuLinks,
		footerMenuLinks,

		// Static UI Dictionary
		dict,

	] = await Promise.all(promises) as [
		IGlobal.IProps["themesOptionsContent"],
		IGlobal.IProps["mobileLinks"],
		IGlobal.IProps["copyrightLinks"],
		IGlobal.IProps["navbarMenuLinks"],
		IGlobal.IProps["footerMenuLinks"],
		Awaited<ReturnType<typeof getDictionary>>,
	];

	const globalProps: IGlobal.IProps = {
		themesOptionsContent,

		// Website Links
		mobileLinks,
		copyrightLinks,
		navbarMenuLinks,
		footerMenuLinks,

  };

	// Site-wide structured data (JSON-LD) — Person + WebSite, using the same
	// global content already fetched above.
	const structuredData = [
		buildPersonSchema({
			siteName: SITE_NAME!,
			siteUrl: SITE_URL!,
			themeOptions: globalProps.themesOptionsContent,
		}),
		buildWebsiteSchema({ siteName: SITE_NAME!, siteUrl: SITE_URL! }),
	];

  return (
    <html lang={locale}>
      <head>
        {/* Structured Data (JSON-LD) */}
        <StructuredData data={structuredData} />
      </head>

      {/* Vercel Analytics */}
      <Analytics />

    	{/* Vercel Speed Insights */}
      <SpeedInsights />

      <body>
        {/* Google Tag Manager NoScript — Google's convention places this immediately
        after the opening <body> tag. Not consent-gated: see the note in
        GoogleTagManagerNoScript's doc comment for why. */}
        <GoogleTagManagerNoScript />

        {/* No Navbar exists yet in this starter (confirmed via a full repo search) to
        host the locale switcher inside — placed here as a simple, always-visible
        element in the meantime; its exact page placement is a decision for whoever
        builds one, not assumed here. */}
        <LocaleSwitcher currentLocale={locale} />

        {/* Mouse Tracking, Loaders and Transitions (Mounted Globally) */}
        <BlurryCursorMouse />
        <ChangePageTitleOnLeave />
        
        {/* <IntroLoadingAnimation /> */}
        <PixelatedWavePageTransition />
        
        <CookiePolicyContextProvider>
          {/* GoogleTagManager reads consent from CookiePolicyContext, so it must be
          rendered inside this provider — not in <head> — to never load before consent. */}
          <Suspense fallback={null}>
            <GoogleTagManager />
          </Suspense>
          
          {/* Main Page Content */}
          <GlobalContextProvider globalProps={globalProps}>
            <SmoothScrolling>
              {children}
              <CookiePolicy dict={dict.cookiePolicy} />
            </SmoothScrolling>
          </GlobalContextProvider>
        </CookiePolicyContextProvider>
      </body>
    </html>
  );
}

export default RootLayout;
