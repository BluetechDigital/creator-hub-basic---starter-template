/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IAllYoutubeVideos from "@/components/CMS/AllYoutubeVideos/types/allYouTubeVideos";

// Youtube Api Info
import {
	getAllQualifyingVideoIds,
	getYoutubeVideosByIds,
	getAllYoutubePlaylists,
	getAllYoutubeChannelInfo,
	getPlaylistVideoIds,
} from "@/api/YouTube/GetAllYoutubeContent";

// Static UI Dictionary
import { getLocale } from "@/i18n/getLocale";
import { getDictionary } from "@/i18n/dictionaries";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/AllYoutubeVideos/styles/AllYoutubeVideos.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import VideosGrid from "@/components/CMS/AllYoutubeVideos/fragments/VideosGrid";
import StructuredData from "@/components/Global/StructuredData/StructuredData";
import { buildVideoItemListSchema } from "@/components/Global/StructuredData/builders";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX Youtube Watch URL Builder XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const buildWatchUrl = (videoId: string): string => `https://www.youtube.com/watch?v=${videoId}`;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Configuration XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Page 1 is 2 hero cards + a flat 4-per-row grid for the rest, 22 total (see
// VideosGrid.tsx). Every page after that is a flat 20-per-page grid, confirmed
// with the client — both counts feed the exact ID slicing below.
const PAGE_1_COUNT = 22;
const SUBSEQUENT_PAGE_COUNT = 20;
const MIN_REGULAR_VIDEO_DURATION_SECONDS = 60;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Pagination Math XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Computes total page count from the exact number of qualifying videos —
 * page 1 holds `PAGE_1_COUNT`, every page after that holds
 * `SUBSEQUENT_PAGE_COUNT`. Always at least 1 page, even for an empty catalog,
 * so there's always something for `VideosGrid`'s empty state to render inside.
 * @param totalVideos The exact count from `getAllQualifyingVideoIds`.
 */
const computeTotalPages = (totalVideos: number): number => {
	if (totalVideos <= PAGE_1_COUNT) return 1;
	return 1 + Math.ceil((totalVideos - PAGE_1_COUNT) / SUBSEQUENT_PAGE_COUNT);
};

/**
 * Slices the exact video IDs belonging to a given page out of the full,
 * catalog-ordered ID list — this is what makes "jump straight to page N"
 * possible against an API that otherwise only supports sequential
 * pagination (see `getAllQualifyingVideoIds`'s doc comment).
 * @param allIds The full, catalog-ordered qualifying video ID list.
 * @param page The 1-indexed page to slice out (already clamped by the caller).
 */
const sliceIdsForPage = (allIds: string[], page: number): string[] => {
	if (page === 1) return allIds.slice(0, PAGE_1_COUNT);

	const start = PAGE_1_COUNT + (page - 2) * SUBSEQUENT_PAGE_COUNT;
	return allIds.slice(start, start + SUBSEQUENT_PAGE_COUNT);
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX AllYoutubeVideos Component XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders the channel's regular (non-Shorts) uploads as a filterable, paginated
 * archive: a "Videos" eyebrow + the ACF `title` heading, a filter bar (title
 * search, playlist, date range), the video grid (2 hero cards + a flat 4-per-row
 * grid on page 1, a flat 20-per-page grid beyond that), and real numbered
 * pagination — see `VideosGrid.tsx`/`Pagination.tsx` for where that layout
 * actually lives. Async Server Component — data is fetched inside the component
 * body rather than at module scope so it runs per-request, matching Next's
 * per-request fetch caching/revalidation.
 *
 * Resolves the requested page via `getAllQualifyingVideoIds` (one cached,
 * full-catalog walk giving an exact, ordered ID list) + `getYoutubeVideosByIds`
 * (full details for just that page's exact IDs) — not `getYoutubeVideosPage`'s
 * sequential resume-token pagination, which can't jump to an arbitrary page
 * without having walked every page before it. `LatestVideos.tsx` still uses
 * that simpler function for its own, different need (a handful of recent
 * videos, no page-jumping). Complementary to `AllYoutubeShortsVideos`, which
 * still uses the older flat `getAllYoutubeVideos()` (unpaginated, <=50 items)
 * — that component's own pagination/filtering rework is a separate, later
 * round.
 *
 * The playlist filter only lists playlists with real overlap against the full
 * qualifying catalog (not just the current page) — confirmed live that some
 * channel playlists share zero videos with the configured archive source, so
 * listing them as filter options would always silently match nothing.
 *
 * Cards link to this app's own `/videos/{videoId}` pages, not out to youtube.com
 * — see `app/[locale]/videos/[slug]/page.tsx`.
 *
 * `getAllQualifyingVideoIds`/`getAllYoutubePlaylists`/`getAllYoutubeChannelInfo`
 * all throw on a genuine API/network failure (not just missing env vars) —
 * caught here, same graceful-degradation shape as `AllBlogPosts.tsx`'s own
 * `Promise.all`, so a transient YouTube API blip degrades this block to its
 * empty state instead of crashing the whole `/videos` page.
 * @param title The ACF `title` field for this block's header, already machine-translated
 * upstream in `RenderFlexibleContent.tsx`'s `ResolvedBlock` (see its `PROSE_FIELDS`).
 * @param page The requested `?page=` number from `app/[locale]/videos/page.tsx`, clamped here into `[1, totalPages]`.
 */
const AllYoutubeVideos = async ({ title, page }: IAllYoutubeVideos.IProps) => {

	const locale = await getLocale();
	const dict = await getDictionary(locale);

	let allQualifyingVideoIds: string[] = [];
	let youtubeChannelPlaylists: IAllYoutubeVideos.IVideosGrid["youtubeChannelPlaylists"] = [];
	let youtubeChannelInfo: IAllYoutubeVideos.IVideosGrid["youtubeChannelInfo"] = {} as IAllYoutubeVideos.IVideosGrid["youtubeChannelInfo"];
	let youtubeVideos: IAllYoutubeVideos.IVideosGrid["youtubeVideos"] = [];
	let playlistVideoIds: IAllYoutubeVideos.IVideosGrid["playlistVideoIds"] = {};
	let totalPages = 1;
	let currentPage = 1;

	try {
		// Fetched inside the component so it runs per-request, matching Next's
		// per-request fetch caching/revalidation instead of once at module load.
		[
			allQualifyingVideoIds,
			youtubeChannelPlaylists,
			youtubeChannelInfo,
		] = await Promise.all([
			getAllQualifyingVideoIds({ minDurationSeconds: MIN_REGULAR_VIDEO_DURATION_SECONDS }),
			getAllYoutubePlaylists(),
			getAllYoutubeChannelInfo(),
		]);

		totalPages = computeTotalPages(allQualifyingVideoIds.length);
		currentPage = Math.min(Math.max(page ?? 1, 1), totalPages);

		const pageVideoIds = sliceIdsForPage(allQualifyingVideoIds, currentPage);
		const unorderedVideos = await getYoutubeVideosByIds(pageVideoIds);

		// getYoutubeVideosByIds doesn't guarantee the same order it was asked for
		// (see its own doc comment) — restore catalog order (most recent first)
		// so the hero cards on page 1 are genuinely the most recent uploads.
		const videoById = new Map(unorderedVideos.map((video) => [video.videoId, video]));
		youtubeVideos = pageVideoIds
			.map((id) => videoById.get(id))
			.filter((video): video is (typeof unorderedVideos)[number] => Boolean(video));

		// Playlist video-ID membership, for VideosGrid's playlist filter — one
		// playlistItems.list call chain per playlist (fully paginated, not capped
		// at 50 — see getPlaylistVideoIds's doc comment for why that matters), run
		// after the playlists themselves resolve. getPlaylistVideoIds never
		// throws, so a single playlist's fetch failing only costs that one filter
		// option, not the whole page.
		const playlistVideoIdsEntries = await Promise.all(
			youtubeChannelPlaylists.map(
				async (playlist) => [playlist.id, await getPlaylistVideoIds(playlist.id)] as const,
			),
		);
		playlistVideoIds = Object.fromEntries(playlistVideoIdsEntries);
	} catch (error) {
		console.log(error);
	}

	// Only offer playlists that actually share a video with the configured
	// archive source — see this component's own doc comment for why.
	const qualifyingIdSet = new Set(allQualifyingVideoIds);
	const availablePlaylists = youtubeChannelPlaylists.filter(
		(playlist) => (playlistVideoIds[playlist.id] ?? []).some((videoId) => qualifyingIdSet.has(videoId)),
	);

	const videoListSchema = buildVideoItemListSchema(youtubeVideos, buildWatchUrl);

	return (
		<div className={styles.allYoutubeVideos}>
			<StructuredData data={videoListSchema} />
			<div className={styles.allYoutubeVideosHeader}>
				<span className={styles.allYoutubeVideosEyebrow}>{dict.videos.eyebrow}</span>
				<h2 className={styles.allYoutubeVideosHeading}>{title || dict.videos.defaultHeading}</h2>
			</div>
			<VideosGrid
				youtubeVideos={youtubeVideos}
				youtubeChannelInfo={youtubeChannelInfo}
				youtubeChannelPlaylists={availablePlaylists}
				playlistVideoIds={playlistVideoIds}
				currentPage={currentPage}
				totalPages={totalPages}
				dict={{ ...dict.videos, ...dict.common }}
			/>
		</div>
	);
};

export default AllYoutubeVideos;
