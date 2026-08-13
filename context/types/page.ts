/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IFlexibleContent from "@/graphql/CMS/types/flexibleContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX PAGES XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/* PAGE: Project Types, Content & Content Provider Interface */
export type ITypes = {
    home: string;
};

// Context value is nested under `memoizedValues` (matching PageContextProvider's
// useMemo'd value) rather than exposing `content`/`postTypeFlexibleContent` directly —
// consumers read `memoizedValues.content` / `memoizedValues.postTypeFlexibleContent`.
export type IContext = {
    memoizedValues: {
        postTypeFlexibleContent: string;
        content: IFlexibleContent.IProps;
    }
};

export type IContextProvider = {
    children: React.ReactNode;
    postTypeFlexibleContent: string;
    content: IFlexibleContent.IProps;
};