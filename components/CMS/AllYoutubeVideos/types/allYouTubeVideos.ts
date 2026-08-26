/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IFlexibleContent from "@/graphql/CMS/types/flexibleContent";
import { IYoutubeVideos, IYoutubePlaylists, IYoutubeChannelInfo } from "@/api/YouTube/GetAllYoutubeContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export type IProps = IFlexibleContent.IBaseFixedProps & {
    /** ACF field — dynamic heading for the archive header, same pattern as `AllBlogPosts`'s. */
    title?: string;
    /** The archive's current `?page=` number, parsed in `app/videos/page.tsx` and threaded down through `RenderFlexibleContent` — see that file's doc comment. Defaults to `1` when absent (e.g. this block rendered somewhere other than `/videos`). */
    page?: number;
};

export type IVideosGrid = {
    youtubeVideos: IYoutubeVideos;
    youtubeChannelInfo: IYoutubeChannelInfo;
    /** Only the playlists that actually overlap with the configured video source — see `AllYoutubeVideos.tsx`'s doc comment for why every channel playlist can't just be listed indiscriminately. */
    youtubeChannelPlaylists: IYoutubePlaylists;
    /** `playlistId -> video IDs`, built in `AllYoutubeVideos.tsx` via `getPlaylistVideoIds` — lets `VideosGrid`'s playlist filter work without an extra client-side fetch. */
    playlistVideoIds: Record<string, string[]>;
    /** The current page number, already clamped into `[1, totalPages]` by `AllYoutubeVideos.tsx`. */
    currentPage: number;
    /** Total pages across the whole catalog, computed from `getAllQualifyingVideoIds`'s exact count — not an estimate. */
    totalPages: number;
};

export type IFeaturedVideoCard = {
    video: IYoutubeVideos[number];
};

export type IVideoCard = {
    video: IYoutubeVideos[number];
};

export type IPagination = {
    currentPage: number;
    totalPages: number;
};
