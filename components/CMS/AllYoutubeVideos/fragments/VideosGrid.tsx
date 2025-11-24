"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, memo } from "react";
import * as IAllYoutubeVideos from "@/components/CMS/AllYoutubeVideos/types/allYouTubeVideos";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/AllYoutubeVideos/styles/AllYoutubeVideos.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX AllYoutubeVideos Component XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const VideosGrid: FC<IAllYoutubeVideos.IVideosGrid> = memo(({
    youtubeVideos,
	youtubeChannelInfo,
	youtubeChannelPlaylists,
}) => {

    console.log(youtubeVideos, youtubeChannelInfo, youtubeChannelPlaylists);
    
    return (
        <div className={styles.videosGrid}></div>
    );
});

VideosGrid.displayName = 'VideosGrid';

export default VideosGrid;