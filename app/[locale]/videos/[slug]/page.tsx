/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { Metadata } from "next";
import { notFound } from "next/navigation";
import * as IPost from "@/graphql/CMS/types/post";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Queries Functions XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { getYoutubeVideoById, getVideoIdFromSlug, buildVideoSlug } from "@/api/YouTube/GetAllYoutubeContent";
import { getPostContentBySlug } from "@/graphql/CMS/GetPostContentBySlug";
import { buildVideoArticleSlug } from "@/api/WordPress/CreateVideoArticleDraft";

// CMS content translation + locale-aware SEO
import { translateFields } from "@/i18n/translateContent";
import { buildLocaleAlternates } from "@/i18n/buildAlternates";
import { getDictionary } from "@/i18n/dictionaries";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const SITE_NAME: string | undefined = process.env.SITE_NAME;
const SITE_URL: string | undefined = process.env.SITE_URL;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import Breadcrumbs from "@/app/[locale]/videos/[slug]/fragments/Breadcrumbs";
import VideoHero from "@/app/[locale]/videos/[slug]/fragments/VideoHero";
import ArticleSubHero from "@/app/[locale]/videos/[slug]/fragments/ArticleSubHero";
import LatestVideos from "@/app/[locale]/videos/[slug]/fragments/LatestVideos";

// Reused directly from the single-post page — the embedded article's body,
// table of contents, and share links, unchanged (see ArticleSubHero.tsx's own
// doc comment for why the hero itself is a lighter, adapted component instead).
import ArticleContent from "@/components/Global/Elements/ArticleContent/ArticleContent";
import { extractToc } from "@/components/Global/Elements/ArticleContent/extractToc";
import TableOfContents from "@/app/[locale]/posts/[slug]/fragments/TableOfContents";
import ShareLinks from "@/app/[locale]/posts/[slug]/fragments/ShareLinks";

import StructuredData from "@/components/Global/StructuredData/StructuredData";
import { buildVideoObjectSchema, buildArticleSchema } from "@/components/Global/StructuredData/builders";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/app/[locale]/videos/[slug]/styles/SingleVideo.module.css";
// .postBody/.postSidebar/.postMain — reused directly, not duplicated into
// SingleVideo.module.css (see ArticleSubHero.tsx's own styling note).
import postStyles from "@/app/[locale]/posts/[slug]/styles/SinglePost.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX Youtube Watch URL Builder XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const buildWatchUrl = (videoId: string): string => `https://www.youtube.com/watch?v=${videoId}`;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Generated Article Fetch XXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Fetches this video's generated article (`app/api/videos/generate-articles/route.ts`
 * / `api/WordPress/CreateVideoArticleDraft.ts`), translated for the current
 * locale — shared by `generateMetadata` and `SingleVideoPage` so the fetch/
 * translate logic isn't duplicated between them. `getPostContentBySlug` only
 * ever resolves a **published** post (never a draft still awaiting the
 * creator's review — see that function's own `status: PUBLISH` filter), and
 * resolves to `undefined` for the common case where no article has been
 * generated/published for this video yet, which is never an error state here.
 * @param videoId The video to look up a generated article for.
 * @returns The article's content fields, already machine-translated for
 * `locale` (`content` as the HTML field), or `undefined` if none is published.
 */
const getTranslatedVideoArticle = async (videoId: string): Promise<IPost.IProps | undefined> => {
	let post: IPost.IProps | undefined;

	try {
		post = await getPostContentBySlug(buildVideoArticleSlug(videoId));
	} catch (error) {
		console.log(error);
	}

	if (!post) return undefined;

	return {
		...post,
		...(await translateFields(
			{ title: post.title, excerpt: post.excerpt, content: post.content },
			['content'],
		)),
	};
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Metadata XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Builds Next.js `<head>` metadata for a single video page: the video's own YouTube
 * title, indexable (`robots.index: true`) since this route has real
 * content — `VideoHero`/`ArticleSubHero`+body/`LatestVideos` below.
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
 * `title` is YouTube's own video metadata — a separate translation surface
 * (the YouTube Data API, not Azure/WPGraphQL) that's deliberately left
 * untranslated for now, unrelated to ACF flexible-content's `PROSE_FIELDS`
 * translation in `RenderFlexibleContent.tsx`. `description` prefers the
 * generated article's own (translated) excerpt when one's been published —
 * written prose, and meaningfully better SEO copy than YouTube's own
 * description field, which is frequently link/hashtag clutter — falling back
 * to the video's raw `snippet.description` when no article exists yet, same
 * as before this feature existed. `alternates` is still rebuilt locale-aware
 * via `buildLocaleAlternates`, since the route itself is now locale-prefixed
 * regardless of whether the video's own text is translated.
 *
 * `title` is set via `title.absolute`, not a plain string — the root
 * layout's `title.template` (`%s | ${SITE_NAME}`) would otherwise apply,
 * giving `${videoTitle} | ${SITE_NAME}` with no indication the page is a
 * video at all. `absolute` skips that template entirely, so the full string
 * is built by hand here instead: `${videoTitle} | YouTube Video - ${SITE_NAME}`.
 * Confirmed live: without `absolute`, the video's own title was reaching
 * `<title>` correctly, but with no "YouTube Video" marker in it at all —
 * not a bug in the video-title lookup itself, just the wrong metadata API
 * for a page that wants to override its parent's template rather than
 * extend it.
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

	const post = await getTranslatedVideoArticle(video.videoId);
	const description = post?.excerpt ? post.excerpt.replace(/<[^>]+>/g, '').trim() : video.snippet.description;

	return {
		title: { absolute: `${video.snippet.title} | YouTube Video - ${SITE_NAME}` },
		description,
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
 * This page doubles as both the video page and, when a generated article
 * exists for it, that article's own page — `ArticleSubHero` plus a
 * `.postBody`/`.postSidebar`/`.postMain` layout (table of contents, share
 * links, the article's HTML body) render directly below `VideoHero`, reusing
 * the exact components `app/[locale]/posts/[slug]/page.tsx` uses for a
 * standalone post. The underlying WordPress post is never reachable at its
 * own `/posts/video-article-{id}` URL — that route 404s for these slugs (see
 * `app/[locale]/posts/[slug]/page.tsx`) — so the content only ever exists at
 * this one URL, avoiding duplicate content across two indexable pages.
 * `getTranslatedVideoArticle` resolves to `undefined` for the (common) case
 * where no article has been generated/published for this video yet, in which
 * case none of that section renders — same graceful-absence handling the
 * standalone `VideoArticleLink` teaser used to do at the page level before
 * this content moved inline.
 *
 * Composes `Breadcrumbs`, `VideoHero` (embed + title/description/channel/
 * date/stats), the article section (when present), and `LatestVideos` —
 * mirroring the single-post page's `Breadcrumbs`/`PostHero`/`LatestPosts`
 * composition shape in `app/[locale]/posts/[slug]/page.tsx`.
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

	const { locale, slug } = await params;
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

	const post = await getTranslatedVideoArticle(video.videoId);
	const toc = post ? extractToc(post.content) : undefined;
	const dict = await getDictionary(locale);

	const schemas = [
		buildVideoObjectSchema(video, buildWatchUrl(video.videoId)),
		...(post ? [buildArticleSchema({ siteUrl: SITE_URL!, path: `/videos/${slug}`, post })] : []),
	];

	return (
		<article className={styles.singleVideo}>
			<StructuredData data={schemas} />
			<Breadcrumbs videoTitle={video.snippet.title} />
			<VideoHero video={video} />
			{post && toc && (
				<>
					<ArticleSubHero post={post} />
					<div className={postStyles.postBody}>
						<aside className={postStyles.postSidebar}>
							<TableOfContents headings={toc.headings} />
							<ShareLinks dict={dict.singlePost} />
						</aside>
						<div className={postStyles.postMain}>
							<ArticleContent content={toc.contentWithAnchors} />
						</div>
					</div>
				</>
			)}
			<LatestVideos excludeVideoId={video.videoId} />
		</article>
	);
};

SingleVideoPage.displayName = 'SingleVideoPage';

export default SingleVideoPage;
