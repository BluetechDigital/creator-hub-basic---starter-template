"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, useMemo } from "react";
import * as IPage from "@/context/types/page";
import { PageContext } from "@/context/pages";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Page Context Provider XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const PageContextProvider: FC<IPage.IContextProvider> = ({
	content,
	children,
	postTypeFlexibleContent,
}) => {

	// Memoize the context value
    const memoizedValues = useMemo(() => {
        return {
            content: content,
            postTypeFlexibleContent: postTypeFlexibleContent,
        };
	}, [content, postTypeFlexibleContent]); // Dependencies are the props passed to the provider
	
	return (
		<PageContext.Provider value={{memoizedValues}}>
			{children}
		</PageContext.Provider>
	);
};

PageContextProvider.displayName = 'PageContextProvider';

export default PageContextProvider;
