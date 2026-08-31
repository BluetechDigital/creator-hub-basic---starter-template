/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import type { IYoutubeVideos } from "@/api/YouTube/GetAllYoutubeContent";
import { formatCount } from "@/api/YouTube/GetAllYoutubeContent";
import { getLocale } from "@/i18n/getLocale";
import { getDictionary, formatTemplate } from "@/i18n/dictionaries";
import { formatLocaleDate } from "@/i18n/formatLocaleDate";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/app/[locale]/videos/[slug]/styles/SingleVideo.module.css";

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
 * `views`/`likes`/`comments` reuse the same `dict.videos.views`/`.likes`/
 * `.comments` templates `VideoCard.tsx` already uses in the archive grid —
 * these are this app's own UI chrome around YouTube's numeric stats, not
 * YouTube's own content, unlike `video.snippet.title`/`channelTitle`, which
 * stay untranslated (see this component's own doc comment above). The
 * published date is formatted via `formatLocaleDate` (native
 * `Intl.DateTimeFormat`), not the `dateformat` package this used to use —
 * see that helper's own doc comment for why. Async Server Component — reads
 * the current locale directly (`getLocale()`) for both.
 * @param video The video's full details, as returned by `getYoutubeVideoById`.
 */
const VideoHero = async ({ video }: IVideoHero) => {

	const locale = await getLocale();
	const dict = await getDictionary(locale);

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
						<span className={styles.videoMetaText}>{formatLocaleDate(new Date(video.snippet.publishedAt), locale, true)}</span>
					</div>
					<div className={styles.videoStatsRow}>
						<span>{formatTemplate(dict.videos.views, { count: formatCount(video.statistics.viewCount) })}</span>
						<span className={styles.videoStatsDot} aria-hidden="true" />
						<span>{formatTemplate(dict.videos.likes, { count: formatCount(video.statistics.likeCount) })}</span>
						<span className={styles.videoStatsDot} aria-hidden="true" />
						<span>{formatTemplate(dict.videos.comments, { count: formatCount(video.statistics.commentCount) })}</span>
					</div>
				</div>
			</div>
		</header>
	);
};

VideoHero.displayName = 'VideoHero';

export default VideoHero;
