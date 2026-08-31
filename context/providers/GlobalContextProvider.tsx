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

/**
 * Provides site-wide content (theme options and menu/footer links, fetched once in
 * `app/[locale]/layout.tsx`) via `GlobalContext`, and wraps `children` in a `<motion.main>` that
 * transitions between its `"initial"` and `"animate"` states.
 *
 * Note: `initial="initial"` / `animate="animate"` here are framer-motion variant
 * *names*, not inline animation objects — this only has a visible effect if `children`
 * (or elements within it) define matching `initial`/`animate` variants; otherwise these
 * props are no-ops.
 *
 * Wrapped in `memo` because it sits high in the tree (in `app/[locale]/layout.tsx`, above
 * `children`) and its own props (`globalProps`) only change when global CMS content
 * changes, so re-rendering it on unrelated state changes elsewhere in the tree would be
 * wasted work.
 *
 * @param globalProps - Global content object (theme options, menu/footer links).
 * @param children - App content to render below the provider.
 */
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
			<motion.main
				initial="initial"
				animate="animate"
				exit={{opacity: 0}}
			>
				{children}
			</motion.main>
		</GlobalContext.Provider>
	);
});

GlobalContextProvider.displayName = 'GlobalContextProvider';

export default GlobalContextProvider;
