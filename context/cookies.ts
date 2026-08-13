"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { createContext, useContext } from "react";
import * as ICookiePolicy from "@/context/types/cookies";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXX Create Cookie Policy context XXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export const CookiePolicyContext = createContext<ICookiePolicy.IContext | null>(null);

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXX Custom hook to use the Cookie Policy context XXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Reads the Cookie Policy context (consent state plus accept/decline handlers).
 *
 * @throws {Error} If called outside of a `CookiePolicyContextProvider` — the context
 * defaults to `null`, and that default is treated as "no provider" rather than a valid
 * value.
 * @returns The cookie policy context value.
 */
const useCookiePolicy = () => {
	const context = useContext(CookiePolicyContext);
	
  	if (context === null) {
    	throw new Error("useCookiePolicy must be used within a CookiePolicyProvider");
	}
	
  return context;
};

useCookiePolicy.displayName = 'useCookiePolicy';

export default useCookiePolicy;