/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import type { Metadata } from "next";
import { Suspense, ReactNode, JSX } from 'react';

// Global CSS
import "@/styles/globals.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Context Providers Components
import ApolloContextProvider from "@/context/providers/ApolloContextProvider";
import CookiePolicyContextProvider from "@/context/providers/CookiePolicyContextProvider";

// Vercel Analytics & Speed Insights
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Other Components
import SmoothScrolling from "@/components/Global/SmoothScrolling";
import GoogleTagManager, { GoogleTagManagerNoScript } from "@/components/Global/Analytics/GoogleTagManager";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const SITE_NAME: string | undefined = process.env.SITE_NAME;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Metadata XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export const metadata: Metadata = {
  title: {
    default: SITE_NAME!,
    template: `%s | ${SITE_NAME}`
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Suspense fallback={null}>
          <GoogleTagManager />
        </Suspense>
      </head>
      <GoogleTagManagerNoScript />
      {/* Vercel Analytics */}
    	<Analytics />
    	{/* Vercel Speed Insights */}
    	<SpeedInsights />
      <body>
        <ApolloContextProvider>
          <CookiePolicyContextProvider>
            <SmoothScrolling>
              <main>
                {children}
              </main>
            </SmoothScrolling>
          </CookiePolicyContextProvider>
				</ApolloContextProvider>
      </body>
    </html>
  );
}
