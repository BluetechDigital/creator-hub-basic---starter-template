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

// Static UI Dictionary
import { getLocale } from "@/i18n/getLocale";
import { getDictionary } from "@/i18n/dictionaries";

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

/**
 * Renders the channel's YouTube Shorts feed (every upload of 60 seconds or less).
 * Async Server Component — data is fetched inside the component body rather than at module
 * scope so it runs per-request, matching Next's per-request fetch caching/revalidation.
 * Complementary to AllYoutubeVideos: both read from the same `getAllYoutubeVideos()` result
 * and split it by duration — this component keeps Shorts (60s or less), while
 * AllYoutubeVideos keeps everything longer.
 *
 * Renders a "Shorts" eyebrow (`dict.videos.shortsEyebrow` — left untranslated in
 * every locale on purpose, matching YouTube's own localized UI, which keeps
 * "Shorts" as a product name rather than translating it) + the ACF `title`
 * heading (falling back to `dict.videos.shortsDefaultHeading` when absent),
 * same pattern as `AllBlogPosts`/`AllYoutubeVideos`. `title` itself is
 * machine-translated upstream, in `RenderFlexibleContent.tsx`'s `ResolvedBlock`
 * (see `PROSE_FIELDS` there), before it ever reaches this component. Everything
 * else here — the unpaginated `getAllYoutubeVideos()` fetch, external
 * youtube.com/shorts links — is unchanged; this component's own
 * pagination/filter/internal-linking rework is a separate, later round,
 * deliberately not bundled into this one.
 * @param title The ACF `title` field for this block's header, already translated.
 */
const AllYoutubeShortsVideos = async ({ title }: IAllYoutubeShortsVideos.IProps) => {

	const locale = await getLocale();
	const dict = await getDictionary(locale);

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
			<div className={styles.allYouTubeShortsVideosHeader}>
				<span className={styles.allYouTubeShortsVideosEyebrow}>{dict.videos.shortsEyebrow}</span>
				<h2 className={styles.allYouTubeShortsVideosHeading}>{title || dict.videos.shortsDefaultHeading}</h2>
			</div>
			<VideosGrid
				youtubeVideos={youtubeVideos}
				youtubeChannelInfo={youtubeChannelInfo}
				youtubeChannelPlaylists={youtubeChannelPlaylists}
			/>
		</div>
	);
};

export default AllYoutubeShortsVideos;
