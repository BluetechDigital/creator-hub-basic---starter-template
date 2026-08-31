'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import * as IAllYoutubeVideos from "@/components/CMS/AllYoutubeVideos/types/allYouTubeVideos";
import { formatCount, buildVideoSlug } from "@/api/YouTube/GetAllYoutubeContent";
import { formatTemplate } from "@/i18n/formatTemplate";
import { formatLocaleDate } from "@/i18n/formatLocaleDate";

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
 *
 * Reads the current locale via `useParams()` (not a prop) to build its own
 * link — the standard client-side equivalent to `getLocale()`, which a Client
 * Component can't call itself. `dict` (this locale's `videos` dictionary
 * slice) is a prop, though, threaded down from `AllYoutubeVideos.tsx` the same
 * way `filters`/`page` already are elsewhere.
 * @param video The video to render.
 * @param dict This locale's `videos` dictionary strings — only `views`/`likes`/`comments` are read.
 */
const VideoCard: FC<IAllYoutubeVideos.IVideoCard> = memo(({ video, dict }) => {

	const { locale } = useParams<{ locale: string }>();

	const thumbnail = video.snippet.thumbnails.high
		?? video.snippet.thumbnails.medium
		?? video.snippet.thumbnails.default;

	return (
		<Link href={`/${locale}/videos/${buildVideoSlug(video.snippet.title, video.videoId)}`} className={styles.videoCard}>
			<div className={styles.videoThumbnailWrapper}>
				<Image
					src={thumbnail.url}
					alt={video.snippet.title}
					width={480}
					height={320}
					className={styles.videoThumbnail}
				/>
			</div>
			<span className={styles.videoDate}>{formatLocaleDate(new Date(video.snippet.publishedAt), locale)}</span>
			<h3 className={styles.videoTitle}>{video.snippet.title}</h3>
			<div className={styles.videoStats}>
				<span>{formatTemplate(dict.views, { count: formatCount(video.statistics.viewCount) })}</span>
				<span className={styles.videoStatsDot} aria-hidden="true" />
				<span>{formatTemplate(dict.likes, { count: formatCount(video.statistics.likeCount) })}</span>
				<span className={styles.videoStatsDot} aria-hidden="true" />
				<span>{formatTemplate(dict.comments, { count: formatCount(video.statistics.commentCount) })}</span>
			</div>
		</Link>
	);
});

VideoCard.displayName = 'VideoCard';

export default VideoCard;
