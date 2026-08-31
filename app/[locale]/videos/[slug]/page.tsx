/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { Metadata } from "next";
import { notFound } from "next/navigation";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Queries Functions XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { getYoutubeVideoById, getVideoIdFromSlug, buildVideoSlug } from "@/api/YouTube/GetAllYoutubeContent";

// Locale-aware SEO
import { buildLocaleAlternates } from "@/i18n/buildAlternates";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import Breadcrumbs from "@/app/[locale]/videos/[slug]/fragments/Breadcrumbs";
import VideoHero from "@/app/[locale]/videos/[slug]/fragments/VideoHero";
import LatestVideos from "@/app/[locale]/videos/[slug]/fragments/LatestVideos";
import StructuredData from "@/components/Global/StructuredData/StructuredData";
import { buildVideoObjectSchema } from "@/components/Global/StructuredData/builders";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/app/[locale]/videos/[slug]/styles/SingleVideo.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX Youtube Watch URL Builder XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const buildWatchUrl = (videoId: string): string => `https://www.youtube.com/watch?v=${videoId}`;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Metadata XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Builds Next.js `<head>` metadata for a single video page: the video's own YouTube
 * title/description, indexable (`robots.index: true`) since this route has real
 * content — `VideoHero`/`LatestVideos` below.
 *
 * Sets `alternates.canonical` to the *current* title+ID slug
 * (`buildVideoSlug`) regardless of which `slug` variant was actually
 * requested — a bare `/videos/{id}` link (an older sitemap entry, or a link
 * built before a video's title changed) still resolves (`getVideoIdFromSlug`
 * only needs the trailing ID), but search engines are pointed at the current
 * canonical URL rather than treating the two as separate pages.
 *
 * `params` is awaited before use because Next.js's App Router passes route params as a
 * Promise for async server components/functions.
 *
 * `title`/`description` are YouTube's own video metadata, not WPGraphQL/ACF
 * content — left untranslated for now, same Phase 1 scope boundary as ACF
 * flexible-content blocks (see `i18n`'s plan doc). `alternates` is still
 * rebuilt locale-aware via `buildLocaleAlternates`, since the route itself is
 * now locale-prefixed regardless of whether the video's own text is translated.
 * @param params - Route params promise; resolves to `{locale, slug}`.
 * @returns Next.js `Metadata` for this video, or minimal no-index metadata if the slug
 * doesn't resolve to a video — `SingleVideoPage` below is what actually 404s; this
 * just has to avoid crashing on `video` being `undefined` in the meantime.
 */
export const generateMetadata = async ({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> => {

	const { locale, slug } = await params;
	const videoId = getVideoIdFromSlug(slug);

	let video;

	try {
		video = videoId ? await getYoutubeVideoById(videoId) : undefined;
	} catch (error) {
		console.log(error);
	}

	if (!video) {
		return { robots: { follow: false, index: false } };
	}

	return {
		title: video.snippet.title,
		description: video.snippet.description,
		alternates: buildLocaleAlternates(locale, `/videos/${buildVideoSlug(video.snippet.title, video.videoId)}`),
		robots: { follow: true, index: true },
	};
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXX Single Video Page Component XXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders a single YouTube video's page for the given `slug` — a readable
 * title slug with the real video ID appended (`buildVideoSlug`, e.g.
 * `funniest-posts-on-the-internet-ep-627-RQlRGCrzCEY`), confirmed with you
 * over a pure-title slug specifically because the ID suffix makes this
 * collision-free by construction and keeps the lookup here a single direct
 * `getYoutubeVideoById` call — no catalog-wide title search needed.
 * `getVideoIdFromSlug` recovers the ID from `slug`'s fixed-length trailing
 * segment; see that function's own doc comment for why a bare
 * `/videos/{id}` link (this route's older URL shape) still resolves
 * correctly under the same parsing.
 *
 * Composes `Breadcrumbs`, `VideoHero` (embed + title/channel/date/stats), and
 * `LatestVideos` — mirroring the single-post page's
 * `Breadcrumbs`/`PostHero`/`LatestPosts` composition shape in
 * `app/[locale]/posts/[slug]/page.tsx`.
 *
 * `getYoutubeVideoById` throws on a network/API-level failure (not just a
 * resolved-`undefined` "no such video") — caught here so a YouTube API blip 404s
 * cleanly instead of surfacing as an unhandled 500, same pattern as
 * `app/[locale]/posts/[slug]/page.tsx`'s `getPostContentBySlug` handling.
 *
 * `params` is awaited before use because Next.js's App Router passes route params as
 * a Promise for async server components.
 * @param params - Route params promise; resolves to `{locale, slug}`.
 */
const SingleVideoPage = async ({ params }: { params: Promise<{ locale: string; slug: string }> }) => {

	const { slug } = await params;
	const videoId = getVideoIdFromSlug(slug);

	let video;

	try {
		video = videoId ? await getYoutubeVideoById(videoId) : undefined;
	} catch (error) {
		console.log(error);
	}

	if (!video) {
		notFound();
	}

	const videoSchema = buildVideoObjectSchema(video, buildWatchUrl(video.videoId));

	return (
		<article className={styles.singleVideo}>
			<StructuredData data={videoSchema} />
			<Breadcrumbs videoTitle={video.snippet.title} />
			<VideoHero video={video} />
			<LatestVideos excludeVideoId={video.videoId} />
		</article>
	);
};

SingleVideoPage.displayName = 'SingleVideoPage';

export default SingleVideoPage;
