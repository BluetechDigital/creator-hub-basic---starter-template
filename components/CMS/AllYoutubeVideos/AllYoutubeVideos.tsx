/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IAllYoutubeVideos from "@/components/CMS/AllYoutubeVideos/types/allYouTubeVideos";

// Youtube Api Info
import {
	getAllYoutubeVideos,
	getAllYoutubePlaylists,
	getAllYoutubeChannelInfo,
	iso8601DurationToSeconds,
} from "@/api/YouTube/GetAllYoutubeContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/AllYoutubeVideos/styles/AllYoutubeVideos.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import VideosGrid from "@/components/CMS/AllYoutubeVideos/fragments/VideosGrid";
import StructuredData from "@/components/Global/StructuredData/StructuredData";
import { buildVideoItemListSchema } from "@/components/Global/StructuredData/builders";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX Youtube Watch URL Builder XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const buildWatchUrl = (videoId: string): string => `https://www.youtube.com/watch?v=${videoId}`;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX AllYoutubeVideos Component XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders the channel's full YouTube uploads feed (every upload longer than 60 seconds).
 * Async Server Component — data is fetched inside the component body rather than at module
 * scope so it runs per-request, matching Next's per-request fetch caching/revalidation.
 * Complementary to AllYoutubeShortsVideos: both read from the same `getAllYoutubeVideos()`
 * result and split it by duration — this component keeps videos over 60s, while
 * AllYoutubeShortsVideos keeps the Shorts (60s or less).
 */
const AllYoutubeVideos = async ({}: IAllYoutubeVideos.IProps) => {

	// Fetched inside the component so it runs per-request, matching Next's
	// per-request fetch caching/revalidation instead of once at module load.
	const [
		allYoutubeVideos,
		youtubeChannelPlaylists,
		youtubeChannelInfo,
	] = await Promise.all([
		getAllYoutubeVideos(),
		getAllYoutubePlaylists(),
		getAllYoutubeChannelInfo(),
	]);

	// getAllYoutubeVideos() returns every upload; Shorts (<=60s) belong on the Shorts
	// feed (AllYoutubeShortsVideos), not here.
	const youtubeVideos = allYoutubeVideos.filter(
		(video) => iso8601DurationToSeconds(video.contentDetails.duration) > 60,
	);

	const videoListSchema = buildVideoItemListSchema(youtubeVideos, buildWatchUrl);

	return (
		<div className={styles.allYoutubeVideos}>
			<StructuredData data={videoListSchema} />
			<VideosGrid
				youtubeVideos={youtubeVideos}
				youtubeChannelInfo={youtubeChannelInfo}
				youtubeChannelPlaylists={youtubeChannelPlaylists}
			/>
		</div>
	);
};

export default AllYoutubeVideos;