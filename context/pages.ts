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

const usePageContext = () => {
	const content = useContext(PageContext);

	if (content === undefined) {
		throw new Error(`useDynamicPageContext must be used to render content.`);
	}

	return content;
};

usePageContext.displayName = 'usePageContext';

export default usePageContext;