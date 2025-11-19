/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IPost from "@/context/types/post";
import * as IPage from "@/context/types/page";
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
};

// Preview pages
export const flexibleContentType: IFlexibleContentType.ITypes = {
    // Public pages
    pages: "DefaultTemplate_Flexiblecontent_FlexibleContent",
    // Preview pages
    previewPage: "Page_Flexiblecontent_FlexibleContent",
    previewPost: "Post_Flexiblecontent_FlexibleContent",
};
