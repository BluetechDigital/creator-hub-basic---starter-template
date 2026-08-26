/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IFlexibleContent from "@/graphql/CMS/types/flexibleContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export type IProps = IFlexibleContent.IBaseFixedProps & {
    /** ACF field — not yet given a defined purpose distinct from `AllYoutubeVideos` (this block is still otherwise an empty stub — see `YouTubeVideoGrid.tsx`'s doc comment). */
    title?: string;
};