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

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Context Providers Components
import GlobalContextProvider from "@/context/providers/GlobalContextProvider";
import CookiePolicyContextProvider from "@/context/providers/CookiePolicyContextProvider";

// Vercel Analytics & Speed Insights
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Other Components
import SmoothScrolling from "@/components/Global/SmoothScrolling";
import CookiePolicy from "@/components/Global/CookiePolicy/CookiePolicy";
import BlurryCursorMouse from "@/components/Global/BlurryCursorMouse/BlurryCursorMouse";
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

const RootLayout = async ({ children }: { children: ReactNode }): Promise<JSX.Element> => {

  /* PUBLIC PAGES  */
	/* Fetch all global content simultaneously using Promise.all Ensure all functions 
  being awaited are indeed Promise-returning functions. */
  const promises: Promise<unknown>[] = [
    // Custom Post Types
		getThemesOptionsContent(),

		// Website Links
		getAllMobileLinks(),
		getAllCopyrightLinks(),
		getAllNavbarMenuLinks(),
		getAllFooterMenuLinks(),

	];

  // Await all promises to resolve
	const [
		themesOptionsContent,

		// Website Links
		mobileLinks,
		copyrightLinks,
		navbarMenuLinks,
		footerMenuLinks,

	] = await Promise.all(promises);

	/* Construct the globalProps object, ensuring it matches IGlobal.IProps structure.
    TypeScript will help validate this. */
	const globalProps: IGlobal.IProps = {
		themesOptionsContent: themesOptionsContent as IGlobal.IProps["themesOptionsContent"],

		// Website Links
		mobileLinks: mobileLinks as IGlobal.IProps["mobileLinks"],
		copyrightLinks: copyrightLinks as IGlobal.IProps["copyrightLinks"],
		navbarMenuLinks: navbarMenuLinks as IGlobal.IProps["navbarMenuLinks"],
		footerMenuLinks: footerMenuLinks as IGlobal.IProps["footerMenuLinks"],

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
    <html lang="en">
      <head>
        <Suspense fallback={null}>
          <GoogleTagManager />
        </Suspense>

        {/* Google Tag Manager NoScript */}
        <GoogleTagManagerNoScript />

        {/* Structured Data (JSON-LD) */}
        <StructuredData data={structuredData} />
      </head>

      {/* Vercel Analytics */}
      <Analytics />
      
    	{/* Vercel Speed Insights */}
      <SpeedInsights />
      
      <body>
        <CookiePolicyContextProvider>
          <GlobalContextProvider globalProps={globalProps}>
            <SmoothScrolling>
              {children}
              <BlurryCursorMouse />
              <CookiePolicy />
            </SmoothScrolling>
          </GlobalContextProvider>
        </CookiePolicyContextProvider>
      </body>
    </html>
  );
}

export default RootLayout;
