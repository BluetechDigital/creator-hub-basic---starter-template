'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import dateFormat from "dateformat";
import * as IAllYoutubeVideos from "@/components/CMS/AllYoutubeVideos/types/allYouTubeVideos";
import { buildVideoSlug } from "@/api/YouTube/GetAllYoutubeContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/AllYoutubeVideos/styles/AllYoutubeVideos.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXX FeaturedVideoCard Component XXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders the video archive's featured "hero" card — the most recent upload shown
 * full-width with its thumbnail as a backdrop and the date/title overlaid at the
 * bottom on a dark gradient. Same visual treatment as `AllBlogPosts`'s
 * `FeaturedPostCard.tsx`, kept consistent across both archives.
 *
 * `video.snippet.publishedAt` is a proper ISO 8601 string with an explicit UTC
 * designator (unlike WordPress's ambiguous-timezone dates elsewhere in this app), so
 * it's safe to pass straight to `new Date()` here without the `parseWpDate` workaround
 * `PostHero`/`PostCard` need for WP dates.
 * @param video The video to feature — normally the single most recent upload.
 */
const FeaturedVideoCard: FC<IAllYoutubeVideos.IFeaturedVideoCard> = memo(({ video }) => {

	const thumbnail = video.snippet.thumbnails.high
		?? video.snippet.thumbnails.medium
		?? video.snippet.thumbnails.default;

	return (
		<Link href={`/videos/${buildVideoSlug(video.snippet.title, video.videoId)}`} className={styles.featuredVideoCard}>
			<div className={styles.featuredVideoImageWrapper}>
				<Image
					src={thumbnail.url}
					alt={video.snippet.title}
					width={1200}
					height={640}
					className={styles.featuredVideoImage}
					priority
				/>
				<div className={styles.featuredVideoOverlay} aria-hidden="true" />
			</div>
			<div className={styles.featuredVideoContent}>
				<span className={styles.featuredVideoDate}>{dateFormat(new Date(video.snippet.publishedAt), "mmmm dS, yyyy")}</span>
				<h3 className={styles.featuredVideoTitle}>{video.snippet.title}</h3>
			</div>
		</Link>
	);
});

FeaturedVideoCard.displayName = 'FeaturedVideoCard';

export default FeaturedVideoCard;
