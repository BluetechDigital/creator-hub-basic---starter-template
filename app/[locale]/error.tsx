"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { NextPage } from "next";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import Error from "@/components/Global/Error/Error";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Error Page Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// No `metadata`/`generateMetadata` export here — Next.js error boundaries must
// be Client Components (`"use client"` above), and both are explicitly
// unsupported from Client Components (confirmed against
// node_modules/next/dist/docs/.../error.md: "Error boundaries must be Client
// Components, which means that `metadata` and `generateMetadata` exports are
// not supported"). A `metadata` object used to sit here regardless — silently
// inert, never actually applied to `<head>` in any locale — removed rather
// than translated, since translating dead code changes nothing observable.
// `not-found.tsx` (a genuine Server Component) is where translated metadata
// for the 404 case actually works.

/** Route-level error boundary UI, rendered by Next.js when a route segment throws. */
const ErrorPage: NextPage = () => {
	return <Error/>;
};

ErrorPage.displayName = 'ErrorPage';

export default ErrorPage;
