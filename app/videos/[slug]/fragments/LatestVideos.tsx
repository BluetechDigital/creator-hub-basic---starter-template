/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { getYoutubeVideosPage } from "@/api/YouTube/GetAllYoutubeContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/app/videos/[slug]/styles/SingleVideo.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import VideoCard from "@/components/CMS/AllYoutubeVideos/fragments/VideoCard";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type ILatestVideos = {
	excludeVideoId: string;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Configuration XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Fetches one extra beyond what's shown, so excluding the current video (which
// is very likely among the most recent uploads) still leaves a full 3 to show.
const FETCH_TARGET_COUNT = 4;
const DISPLAY_COUNT = 3;
const MIN_REGULAR_VIDEO_DURATION_SECONDS = 60;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX LatestVideos Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders the "Latest videos" section at the bottom of a single video page: up
 * to 3 other regular (non-Shorts) uploads, newest first, excluding the video
 * currently being viewed (`excludeVideoId`). Direct analog of the single-post
 * page's `LatestPosts.tsx`, reusing the archive grid's own `VideoCard.tsx`
 * rather than a new card component — `LatestPosts.tsx` does the same thing
 * with its own `LatestPostCard.tsx` for a *different* reason (post summaries
 * carry different fields than a full post), but a video's summary and full
 * shape are the same `IYoutubeVideos[number]`, so there's nothing distinct
 * for a "latest video" card to need.
 *
 * Async Server Component — data is fetched inside the component body rather
 * than module scope, same fetch convention as `AllYoutubeVideos` (see
 * ARCHITECTURE.md §2). Renders nothing (not an empty section) when there are
 * no other videos to show yet — same graceful-empty-state convention as
 * `LatestPosts`/`VideosGrid`.
 * @param excludeVideoId The video ID currently being viewed.
 */
const LatestVideos = async ({ excludeVideoId }: ILatestVideos) => {

	let videos: Awaited<ReturnType<typeof getYoutubeVideosPage>>["videos"] = [];

	try {
		const page = await getYoutubeVideosPage({
			targetCount: FETCH_TARGET_COUNT,
			minDurationSeconds: MIN_REGULAR_VIDEO_DURATION_SECONDS,
		});
		videos = page.videos
			.filter((video) => video.videoId !== excludeVideoId)
			.slice(0, DISPLAY_COUNT);
	} catch (error) {
		console.log(error);
	}

	if (!videos.length) return null;

	return (
		<section className={styles.latestVideos}>
			<span className={styles.latestVideosEyebrow}>More to watch</span>
			<h2 className={styles.latestVideosHeading}>Latest videos</h2>
			<div className={styles.latestVideosGrid}>
				{videos.map((video) => (
					<VideoCard key={video.videoId} video={video} />
				))}
			</div>
		</section>
	);
};

LatestVideos.displayName = 'LatestVideos';

export default LatestVideos;
