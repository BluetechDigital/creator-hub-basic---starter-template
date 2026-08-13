"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import * as IAllYoutubeShortsVideos from "@/components/CMS/AllYoutubeShortsVideos/types/allYoutubeShortsVideos";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/AllYoutubeShortsVideos/styles/AllYoutubeShortsVideos.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX Youtube Shorts URL Builder XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const buildShortsUrl = (videoId: string): string => `https://www.youtube.com/shorts/${videoId}`;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX VideosGrid Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders the grid of video cards for the video list handed down by AllYoutubeShortsVideos,
 * which has already filtered `getAllYoutubeVideos()` down to Shorts (<=60s). `memo`-wrapped
 * client component since it does no data fetching of its own. Each card's thumbnail falls
 * back through `high ?? medium ?? default`, since YouTube's API doesn't guarantee every
 * thumbnail size is present for a given video.
 */
const VideosGrid: FC<IAllYoutubeShortsVideos.IVideosGrid> = memo(({ youtubeVideos }) => {

    return (
        <div className={styles.videosGrid}>
            {youtubeVideos.map((video) => {
                const thumbnail = video.snippet.thumbnails.high
                    ?? video.snippet.thumbnails.medium
                    ?? video.snippet.thumbnails.default;

                return (
                    <Link
                        key={video.videoId}
                        href={buildShortsUrl(video.videoId)}
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
