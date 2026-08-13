'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import * as IAllYoutubeVideos from "@/components/CMS/AllYoutubeVideos/types/allYouTubeVideos";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/AllYoutubeVideos/styles/AllYoutubeVideos.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX Youtube Watch URL Builder XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const buildWatchUrl = (videoId: string): string => `https://www.youtube.com/watch?v=${videoId}`;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX VideosGrid Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const VideosGrid: FC<IAllYoutubeVideos.IVideosGrid> = memo(({ youtubeVideos }) => {

    return (
        <div className={styles.videosGrid}>
            {youtubeVideos.map((video) => {
                const thumbnail = video.snippet.thumbnails.high
                    ?? video.snippet.thumbnails.medium
                    ?? video.snippet.thumbnails.default;

                return (
                    <Link
                        key={video.videoId}
                        href={buildWatchUrl(video.videoId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.videoCard}
                    >
                        <Image
                            src={thumbnail.url}
                            alt={video.snippet.title}
                            width={thumbnail.width}
                            height={thumbnail.height}
                            className={styles.videoThumbnail}
                        />
                        <h3 className={styles.videoTitle}>{video.snippet.title}</h3>
                    </Link>
                );
            })}
        </div>
    );
});

VideosGrid.displayName = 'VideosGrid';

export default VideosGrid;
