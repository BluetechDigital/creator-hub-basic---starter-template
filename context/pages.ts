"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IPost from "@/context/types/post";
import * as IPage from "@/context/types/page";
import { createContext, useContext } from "react";
import * as IFlexibleContentType from "@/context/types/flexibleContentType";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXX PUBLIC PAGES & POSTS & PREVIEW PAGES & POSTS XXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */
// Post Types
export const postType: IPost.ITypes = {
	// Public pages
	pages: "pages",
	posts: "posts",

	// Preview pages
	previewPage: "page",
	previewPost: "post",
};

// Preview pages
export const pageType: IPage.ITypes = {
	// Public pages
	home: "Home",
	blogs: "blogs",
};

// Preview pages
export const flexibleContentType: IFlexibleContentType.ITypes = {
	// Public pages
	pages: "DefaultTemplate_Flexiblecontent_FlexibleContent",
	// Preview pages
	previewPage: "Page_Flexiblecontent_FlexibleContent",
	previewPost: "Post_Flexiblecontent_FlexibleContent",
};

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