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

/**
 * Provides the current page's CMS flexible-content data via `PageContext`. This is the
 * hand-off point in the CMS flexible-content pipeline (see `ARCHITECTURE.md` §1): the
 * page-level route (`app/[slug]/page.tsx` or `app/page.tsx`) fetches the flexible-content
 * blocks for a slug and passes them in here, and downstream `RenderFlexibleContent`
 * reads them back out via `usePageContext` to resolve/render each block.
 *
 * The context value is nested under a single `memoizedValues` key
 * (`<PageContext.Provider value={{memoizedValues}}>`) rather than spread directly, so
 * consumers must destructure `memoizedValues.content` / `memoizedValues.postTypeFlexibleContent`
 * rather than reading `content`/`postTypeFlexibleContent` off the context value directly.
 *
 * @param content - The page's CMS flexible-content data.
 * @param postTypeFlexibleContent - The ACF flexible-content field group name for this content's post type (see `context/constants.ts`).
 * @param children - App content to render below the provider.
 */
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
