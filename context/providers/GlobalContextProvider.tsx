"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, memo } from "react";
import { motion } from "framer-motion";
import { GlobalContext } from "@/context/global";
import * as IGlobal from "@/context/types/global";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXX Create Global Context Provider XXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const GlobalContextProvider: FC<IGlobal.IContextProvider> = memo(({
	children,
	globalProps,
}) => {
	return (
		<GlobalContext.Provider
			value={{
				// Custom Post Types
				themesOptionsContent: globalProps.themesOptionsContent,

				// Website Links
				mobileLinks: globalProps.mobileLinks,
				copyrightLinks: globalProps.copyrightLinks,
				navbarMenuLinks: globalProps.navbarMenuLinks,
				footerMenuLinks: globalProps.footerMenuLinks,
			}}
		>
			<motion.div
				initial="initial"
				animate="animate"
				exit={{opacity: 0}}
			>
				{children}
			</motion.div>
		</GlobalContext.Provider>
	);
});

GlobalContextProvider.displayName = 'GlobalContextProvider';

export default GlobalContextProvider;
