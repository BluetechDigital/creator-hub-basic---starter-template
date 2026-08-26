/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IFlexibleContent from "@/graphql/CMS/types/flexibleContent";
import { IYoutubeVideos, IYoutubePlaylists, IYoutubeChannelInfo } from "@/api/YouTube/GetAllYoutubeContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export type IProps = IFlexibleContent.IBaseFixedProps & {
    /** ACF field — dynamic heading for this block's header, same pattern as `AllBlogPosts`'s. */
    title?: string;
};

export type IVideosGrid = {
    youtubeVideos: IYoutubeVideos;
    youtubeChannelInfo: IYoutubeChannelInfo;
    youtubeChannelPlaylists: IYoutubePlaylists;
};