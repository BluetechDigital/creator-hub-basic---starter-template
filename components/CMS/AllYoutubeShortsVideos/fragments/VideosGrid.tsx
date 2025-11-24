"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, memo } from "react";
import * as IAllYoutubeShortsVideos from "@/components/CMS/AllYoutubeShortsVideos/types/allYoutubeShortsVideos";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/AllYoutubeShortsVideos/styles/AllYoutubeShortsVideos.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX VideosGrid Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const VideosGrid: FC<IAllYoutubeShortsVideos.IVideosGrid> = memo(({
    youtubeVideos,
	youtubeChannelInfo,
	youtubeChannelPlaylists,
}) => {
    
    return (
        <div className={styles.videosGrid}></div>
    );
});

VideosGrid.displayName = 'VideosGrid';

export default VideosGrid;