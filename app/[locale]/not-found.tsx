/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { Metadata, NextPage } from "next";
import { locale as getRootLocale } from "next/root-params";
import { defaultLocale } from "@/context/constants";
import { getDictionary } from "@/i18n/dictionaries";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import Error from "@/components/Global/Error/Error";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Metadata XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Reads the root `locale` param directly via `next/root-params`, not this
 * route's own `i18n/getLocale.ts` wrapper — that wrapper calls `notFound()`
 * itself on an invalid/missing locale, which would be an odd, easy-to-misread
 * recursion from inside the page Next already renders *for* a not-found case.
 * Falls back to `defaultLocale` directly instead (matching `getDictionary()`'s
 * own fallback-to-English behavior for an unrecognized locale).
 */
export const generateMetadata = async (): Promise<Metadata> => {
	const locale = (await getRootLocale()) ?? defaultLocale;
	const dict = await getDictionary(locale);

	return {
		title: dict.notFound.title,
		description: dict.notFound.description,
	};
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXX 404 Not Found Page Component XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/** Rendered by Next.js for unmatched routes (404s). */
const NotFound: NextPage = async () => {
	return <Error/>;
};

NotFound.displayName = 'NotFound';

export default NotFound;
