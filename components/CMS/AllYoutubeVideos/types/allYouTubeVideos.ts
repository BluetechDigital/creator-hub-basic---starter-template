/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IFlexibleContent from "@/graphql/CMS/types/flexibleContent";
import { IYoutubeVideos, IYoutubePlaylists, IYoutubeChannelInfo } from "@/api/YouTube/GetAllYoutubeContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export type IProps = IFlexibleContent.IBaseFixedProps & object;

export type IVideosGrid = {
    youtubeVideos: IYoutubeVideos | unknown;
    youtubeChannelInfo: IYoutubeChannelInfo | unknown;
    youtubeChannelPlaylists: IYoutubePlaylists | unknown;
};