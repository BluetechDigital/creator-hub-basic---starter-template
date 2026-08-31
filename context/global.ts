"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { createContext, useContext } from "react";
import * as IGlobal from "@/context/types/global";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX Create Global context XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export const GlobalContext = createContext<IGlobal.IContext | undefined>(
	undefined
);

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXX Custom hook to use the Global context XXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Reads the Global context (site-wide theme options and menu/footer links populated in
 * `app/[locale]/layout.tsx`).
 *
 * @throws {Error} If called outside of a `GlobalContextProvider` — the context defaults
 * to `undefined`, and that default is treated as "no provider" rather than a valid value.
 * @returns The global context value.
 */
const useGlobalContext = () => {
	const content = useContext(GlobalContext);

	if (content === undefined) {
		throw new Error(`Global Context must be used to render content.`);
	}

	return content;
};

useGlobalContext.displayName = 'useGlobalContext';

export default useGlobalContext;
