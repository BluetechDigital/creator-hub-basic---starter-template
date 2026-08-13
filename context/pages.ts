"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IPage from "@/context/types/page";
import { createContext, useContext } from "react";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX Create Page context XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export const PageContext = createContext<IPage.IContext | undefined>(undefined);

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXX Custom hook to use the Page context XXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Reads the Page context (the current page's CMS flexible-content data, set by
 * `PageContextProvider`).
 *
 * @throws {Error} If called outside of a `PageContextProvider` — the context defaults
 * to `undefined`, and that default is treated as "no provider" rather than a valid value.
 * @returns The page context value (`{memoizedValues: {content, postTypeFlexibleContent}}`).
 */
const usePageContext = () => {
	const content = useContext(PageContext);

	if (content === undefined) {
		throw new Error(`usePageContext must be used to render content.`);
	}

	return content;
};

usePageContext.displayName = 'usePageContext';

export default usePageContext;