/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IAllYoutubeShortsVideos from "@/components/CMS/AllYoutubeShortsVideos/types/allYoutubeShortsVideos";

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

import styles from "@/components/CMS/AllYoutubeShortsVideos/styles/AllYoutubeShortsVideos.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import VideosGrid from "@/components/CMS/AllYoutubeShortsVideos/fragments/VideosGrid";
import StructuredData from "@/components/Global/StructuredData/StructuredData";
import { buildVideoItemListSchema } from "@/components/Global/StructuredData/builders";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX Youtube Shorts URL Builder XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const buildShortsUrl = (videoId: string): string => `https://www.youtube.com/shorts/${videoId}`;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXX AllYoutubeShortsVideos Component XXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const AllYoutubeShortsVideos = async ({}: IAllYoutubeShortsVideos.IProps) => {

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

	// getAllYoutubeVideos() returns every upload; only Shorts (<=60s) belong here —
	// longer uploads are AllYoutubeVideos's feed.
	const youtubeVideos = allYoutubeVideos.filter(
		(video) => iso8601DurationToSeconds(video.contentDetails.duration) <= 60,
	);

	const videoListSchema = buildVideoItemListSchema(youtubeVideos, buildShortsUrl);

	return (
		<div className={styles.allYouTubeShortsVideos}>
			<StructuredData data={videoListSchema} />
			<VideosGrid
				youtubeVideos={youtubeVideos}
				youtubeChannelInfo={youtubeChannelInfo}
				youtubeChannelPlaylists={youtubeChannelPlaylists}
			/>
		</div>
	);
};

export default AllYoutubeShortsVideos;
