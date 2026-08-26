/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC } from "react";
import dateFormat from "dateformat";
import type { IYoutubeVideos } from "@/api/YouTube/GetAllYoutubeContent";
import { formatCount } from "@/api/YouTube/GetAllYoutubeContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/app/videos/[slug]/styles/SingleVideo.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IVideoHero = {
	video: IYoutubeVideos[number];
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX VideoHero Component XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders the single-video page's hero: an embedded YouTube player, title,
 * channel name, published date, and a **read-only** views/likes/comments row.
 * Structurally mirrors the single-post page's `PostHero.tsx` (title, meta line,
 * stats), but with two deliberate differences: the embed replaces the
 * post-hero's featured image as the actual content, and the stats row has no
 * `EngagementBar`-style interactive counterpart — those buttons mutate this
 * app's own reaction system (a WordPress mu-plugin), whereas these are
 * YouTube's own real public counts, which this app has no way to change.
 *
 * The embed URL is built directly (`https://www.youtube.com/embed/{videoId}`)
 * rather than using `video.player.embedHtml` — the API returns that as a full
 * `<iframe>` HTML string sized for its own default dimensions, which would
 * need parsing/stripping to restyle responsively; building the URL directly
 * and wrapping it in this page's own responsive 16:9 container is simpler and
 * gives full control over sizing.
 *
 * `referrerPolicy="strict-origin-when-cross-origin"` is required here,
 * specifically overriding this site's global `Referrer-Policy: no-referrer`
 * (`next.config.ts`) for just this one iframe. YouTube's embedded player
 * relies on the referrer to validate the embed request; with the site-wide
 * `no-referrer` policy applying (as it does to every outgoing request by
 * default), the browser sends none, and YouTube's player fails with "Error
 * 153 — Video player configuration error" on every video, confirmed live.
 * Scoping the override to this iframe's own attribute — rather than loosening
 * the global header — keeps the stricter policy intact for the rest of the
 * site's outgoing requests/navigations.
 * @param video The video's full details, as returned by `getYoutubeVideoById`.
 */
const VideoHero: FC<IVideoHero> = ({ video }) => {

	return (
		<header className={styles.videoHero}>
			<div className={styles.videoHeroInner}>
				<div className={styles.videoEmbedWrapper}>
					<iframe
						src={`https://www.youtube.com/embed/${video.videoId}`}
						title={video.snippet.title}
						className={styles.videoEmbed}
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						referrerPolicy="strict-origin-when-cross-origin"
						allowFullScreen
					/>
				</div>
				<div className={styles.videoHeroContent}>
					<h1 className={styles.videoTitle}>{video.snippet.title}</h1>
					<div className={styles.videoMeta}>
						<span className={styles.videoMetaText}>{video.snippet.channelTitle}</span>
						<span className={styles.videoMetaDot} aria-hidden="true" />
						<span className={styles.videoMetaText}>{dateFormat(new Date(video.snippet.publishedAt), "dddd, mmmm dS, yyyy")}</span>
					</div>
					<div className={styles.videoStatsRow}>
						<span>{formatCount(video.statistics.viewCount)} views</span>
						<span className={styles.videoStatsDot} aria-hidden="true" />
						<span>{formatCount(video.statistics.likeCount)} likes</span>
						<span className={styles.videoStatsDot} aria-hidden="true" />
						<span>{formatCount(video.statistics.commentCount)} comments</span>
					</div>
				</div>
			</div>
		</header>
	);
};

VideoHero.displayName = 'VideoHero';

export default VideoHero;
