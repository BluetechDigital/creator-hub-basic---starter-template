'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import dateFormat from "dateformat";
import * as IAllYoutubeVideos from "@/components/CMS/AllYoutubeVideos/types/allYouTubeVideos";
import { formatCount, buildVideoSlug } from "@/api/YouTube/GetAllYoutubeContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/AllYoutubeVideos/styles/AllYoutubeVideos.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX VideoCard Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders a single video summary card for the archive grid: thumbnail, date, title,
 * then a views/likes/comments stats row from the video's existing `statistics`
 * fields. No dislike count — YouTube's public Data API stopped returning that in
 * 2021. Links to this video's internal `/videos/{titleSlug}-{videoId}` page
 * (`buildVideoSlug`) rather than out to youtube.com, unlike the archive's
 * previous behaviour.
 */
const VideoCard: FC<IAllYoutubeVideos.IVideoCard> = memo(({ video }) => {

	const thumbnail = video.snippet.thumbnails.high
		?? video.snippet.thumbnails.medium
		?? video.snippet.thumbnails.default;

	return (
		<Link href={`/videos/${buildVideoSlug(video.snippet.title, video.videoId)}`} className={styles.videoCard}>
			<div className={styles.videoThumbnailWrapper}>
				<Image
					src={thumbnail.url}
					alt={video.snippet.title}
					width={480}
					height={320}
					className={styles.videoThumbnail}
				/>
			</div>
			<span className={styles.videoDate}>{dateFormat(new Date(video.snippet.publishedAt), "mmmm dS, yyyy")}</span>
			<h3 className={styles.videoTitle}>{video.snippet.title}</h3>
			<div className={styles.videoStats}>
				<span>{formatCount(video.statistics.viewCount)} views</span>
				<span className={styles.videoStatsDot} aria-hidden="true" />
				<span>{formatCount(video.statistics.likeCount)} likes</span>
				<span className={styles.videoStatsDot} aria-hidden="true" />
				<span>{formatCount(video.statistics.commentCount)} comments</span>
			</div>
		</Link>
	);
});

VideoCard.displayName = 'VideoCard';

export default VideoCard;
