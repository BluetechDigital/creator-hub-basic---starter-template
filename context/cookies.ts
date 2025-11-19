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

const useCookiePolicy = () => {
	const context = useContext(CookiePolicyContext);
	
  	if (context === null) {
    	throw new Error("useCookiePolicy must be used within a CookiePolicyProvider");
	}
	
  return context;
};

useCookiePolicy.displayName = 'useCookiePolicy';

export default useCookiePolicy;