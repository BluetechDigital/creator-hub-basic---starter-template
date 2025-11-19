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

const useGlobalContext = () => {
	const content = useContext(GlobalContext);

	if (content === undefined) {
		throw new Error(`Global Context must be used to render content.`);
	}

	return content;
};

useGlobalContext.displayName = 'useGlobalContext';

export default useGlobalContext;
