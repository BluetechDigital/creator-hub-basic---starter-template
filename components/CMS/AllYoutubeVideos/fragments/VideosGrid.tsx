'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, memo, useMemo, useState } from "react";
import * as IAllYoutubeVideos from "@/components/CMS/AllYoutubeVideos/types/allYouTubeVideos";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import FeaturedVideoCard from "@/components/CMS/AllYoutubeVideos/fragments/FeaturedVideoCard";
import VideoCard from "@/components/CMS/AllYoutubeVideos/fragments/VideoCard";
import Pagination from "@/components/CMS/AllYoutubeVideos/fragments/Pagination";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/AllYoutubeVideos/styles/AllYoutubeVideos.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX VideosGrid Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders the video archive: a filter bar (title search, playlist, date range),
 * then the current page's videos, then `Pagination`.
 *
 * `youtubeVideos`/`currentPage`/`totalPages` arrive as props already resolved
 * server-side by `AllYoutubeVideos.tsx` — unlike last round, this component no
 * longer owns any pagination state itself (no more "Show more" accumulator);
 * every page transition is a real `/videos?page=N` navigation handled by
 * `Pagination.tsx`'s `<Link>`s, which re-renders this whole tree with the new
 * page's server-fetched data.
 *
 * Layout: page 1 renders 2 `FeaturedVideoCard`s followed by the rest of its
 * videos in a flat 4-per-row grid; every page after that renders the same
 * flat 4-per-row grid with no hero cards at all — matching the confirmed
 * design (hero treatment is a page-1-only, "most recent uploads" thing).
 *
 * Filtering (title search, playlist, date range) is pure client-side state
 * over *this page's* videos only, same mechanism as before — a filter still
 * can't reach a video sitting on a different page; see
 * `AllYoutubeVideos.tsx`'s doc comment for the accepted scope boundary here.
 * Filters also drop the hero-card treatment entirely and render a flat
 * matching grid instead, since a "featured" video doesn't make sense inside a
 * filtered/searched result set.
 *
 * Playlist filtering matches by video ID membership against `playlistVideoIds`
 * — `youtubeChannelPlaylists` has already been narrowed by `AllYoutubeVideos.tsx`
 * to only playlists with real overlap against the *whole* catalog, not just
 * this page, so an offered option is always meaningful somewhere, even if not
 * necessarily on the page currently loaded.
 */
const VideosGrid: FC<IAllYoutubeVideos.IVideosGrid> = memo(({
	youtubeVideos,
	youtubeChannelPlaylists,
	playlistVideoIds,
	currentPage,
	totalPages,
}) => {

	const [titleSearch, setTitleSearch] = useState('');
	const [playlistId, setPlaylistId] = useState('');
	const [dateFrom, setDateFrom] = useState('');
	const [dateTo, setDateTo] = useState('');

	const hasActiveFilters = Boolean(titleSearch || playlistId || dateFrom || dateTo);

	const filteredVideos = useMemo(() => {
		const search = titleSearch.trim().toLowerCase();
		const playlistMembers = playlistId ? new Set(playlistVideoIds[playlistId] ?? []) : null;
		const fromTime = dateFrom ? new Date(dateFrom).getTime() : null;
		const toTime = dateTo ? new Date(dateTo).getTime() : null;

		return youtubeVideos.filter((video) => {
			if (search && !video.snippet.title.toLowerCase().includes(search)) return false;
			if (playlistMembers && !playlistMembers.has(video.videoId)) return false;

			const publishedTime = new Date(video.snippet.publishedAt).getTime();
			if (fromTime !== null && publishedTime < fromTime) return false;
			if (toTime !== null && publishedTime > toTime) return false;

			return true;
		});
	}, [youtubeVideos, titleSearch, playlistId, playlistVideoIds, dateFrom, dateTo]);

	const clearFilters = () => {
		setTitleSearch('');
		setPlaylistId('');
		setDateFrom('');
		setDateTo('');
	};

	if (!youtubeVideos.length) {
		return <p className={styles.videosGridEmpty}>No videos published yet — check back soon.</p>;
	}

	const showHero = currentPage === 1 && !hasActiveFilters;
	const heroVideos = showHero ? filteredVideos.slice(0, 2) : [];
	const gridVideos = showHero ? filteredVideos.slice(2) : filteredVideos;

	return (
		<div className={styles.videosGrid}>
			<div className={styles.videoFilters}>
				<input
					type="text"
					aria-label="Search videos"
					placeholder="Search videos…"
					className={styles.videoFiltersSearch}
					value={titleSearch}
					onChange={(event) => setTitleSearch(event.target.value)}
				/>

				{youtubeChannelPlaylists.length > 0 && (
					<select
						aria-label="Filter by playlist"
						className={styles.videoFiltersSelect}
						value={playlistId}
						onChange={(event) => setPlaylistId(event.target.value)}
					>
						<option value="">All playlists</option>
						{youtubeChannelPlaylists.map((playlist) => (
							<option key={playlist.id} value={playlist.id}>{playlist.title}</option>
						))}
					</select>
				)}

				<div className={styles.videoFiltersDateRange}>
					<label className={styles.videoFiltersDateLabel}>
						From
						<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
					</label>
					<label className={styles.videoFiltersDateLabel}>
						To
						<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
					</label>
				</div>

				{hasActiveFilters && (
					<button type="button" className={styles.videoFiltersClear} onClick={clearFilters}>
						Clear filters
					</button>
				)}
			</div>

			{filteredVideos.length > 0 ? (
				<>
					{heroVideos.length > 0 && (
						<div className={styles.featuredVideosRow}>
							{heroVideos.map((video) => (
								<FeaturedVideoCard key={video.videoId} video={video} />
							))}
						</div>
					)}

					{gridVideos.length > 0 && (
						<div className={styles.videosGridColumns}>
							{gridVideos.map((video) => (
								<VideoCard key={video.videoId} video={video} />
							))}
						</div>
					)}
				</>
			) : (
				<p className={styles.videosGridEmpty}>No videos match these filters.</p>
			)}

			{!hasActiveFilters && <Pagination currentPage={currentPage} totalPages={totalPages} />}
		</div>
	);
});

VideosGrid.displayName = 'VideosGrid';

export default VideosGrid;
