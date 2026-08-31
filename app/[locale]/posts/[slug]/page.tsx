/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { Metadata } from "next";
import { notFound } from "next/navigation";
import * as ISeo from "@/graphql/CMS/types/seo";
import * as IPost from "@/graphql/CMS/types/post";
import { postType } from "@/context/constants";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Queries Functions XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { getAllSeoContent } from "@/graphql/CMS/GetAllSeoContent";
import { getPostContentBySlug } from "@/graphql/CMS/GetPostContentBySlug";
import { getPostReactions } from "@/graphql/CMS/GetPostReactions";
import { getPostComments } from "@/graphql/CMS/GetPostComments";
import { getCommentReactions } from "@/graphql/CMS/GetCommentReactions";

// CMS content translation + locale-aware SEO
import { translateFields } from "@/i18n/translateContent";
import { buildLocaleAlternates } from "@/i18n/buildAlternates";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import ArticleContent from "@/components/Global/Elements/ArticleContent/ArticleContent";
import { extractToc } from "@/components/Global/Elements/ArticleContent/extractToc";
import LatestPosts from "@/components/Global/Elements/LatestPosts/LatestPosts";
import Breadcrumbs from "@/app/[locale]/posts/[slug]/fragments/Breadcrumbs";
import PostHero from "@/app/[locale]/posts/[slug]/fragments/PostHero";
import TableOfContents from "@/app/[locale]/posts/[slug]/fragments/TableOfContents";
import ShareLinks from "@/app/[locale]/posts/[slug]/fragments/ShareLinks";
import CommentsFeed from "@/app/[locale]/posts/[slug]/fragments/CommentsFeed";
import CommentForm from "@/app/[locale]/posts/[slug]/fragments/CommentForm";

// Structured Data (JSON-LD)
import StructuredData from "@/components/Global/StructuredData/StructuredData";
import { buildArticleSchema, buildBreadcrumbListSchema } from "@/components/Global/StructuredData/builders";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/app/[locale]/posts/[slug]/styles/SinglePost.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const SITE_URL: string | undefined = process.env.SITE_URL;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Metadata XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Builds Next.js `<head>` metadata (title, description, Open Graph, canonical, robots)
 * for a single blog post identified by its slug, by querying WPGraphQL SEO fields for
 * that slug — `getAllSeoContent` already works for posts unchanged (see its own doc
 * comment).
 *
 * `params` is awaited before use because Next.js's App Router passes route params as a
 * Promise for async server components/functions.
 *
 * SEO text fields (`title`/`metaDesc`/`opengraphTitle`/`opengraphDescription`) are
 * machine-translated for non-English locales via `translateFields` — a no-op for
 * English. `opengraphSiteName` is left untranslated (a brand name, not prose).
 * `canonical`/`alternates.languages` are rebuilt via `buildLocaleAlternates` rather
 * than trusting Yoast's raw `seo.canonical`/`seo.opengraphUrl`, which have no locale
 * segment and would be wrong the instant routes are locale-prefixed.
 * @param params - Route params promise; resolves to `{locale, slug}` for the current post.
 * @returns Next.js `Metadata` for this post, or minimal no-index metadata if the slug
 * doesn't match a published post — `SinglePostPage` below is what actually 404s; this
 * just has to avoid crashing on `seo` being `undefined` in the meantime (same pattern
 * as `app/[locale]/[slug]/page.tsx`'s `generateMetadata`).
 */
export const generateMetadata = async ({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> => {

	const { locale, slug } = await params;

	const seo = await getAllSeoContent(slug, postType.posts) as ISeo.IProps | undefined;

	if (!seo) {
		return { robots: { follow: false, index: false } };
	}

	const translatedSeo = await translateFields({
		title: seo.title,
		metaDesc: seo.metaDesc,
		opengraphTitle: seo.opengraphTitle,
		opengraphDescription: seo.opengraphDescription,
	});

	return {
		title: translatedSeo.title,
		description: translatedSeo.metaDesc,
		openGraph: {
			type: 'website',
			url: seo.opengraphUrl,
			title: translatedSeo.opengraphTitle,
			siteName: seo.opengraphSiteName,
			description: translatedSeo.opengraphDescription,
		},
		alternates: buildLocaleAlternates(locale, `/posts/${slug}`),
		robots: {
			follow: true,
			index: true
		}
	};
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX Single Post Page Component XXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders a single blog post for the given slug: a hero header (title, excerpt,
 * author, read time, featured image), a two-column body (table of contents + share
 * links sidebar, article content), and a "Latest news" section of other posts.
 * Unlike `app/[locale]/[slug]/page.tsx`, this route does not go through the ACF
 * flexible-content pipeline — a blog post is standard WP post content, not an ACF
 * block composition — so it fetches `getPostContentBySlug` directly and renders it.
 *
 * `getPostContentBySlug` already returns the post's own `title`, so unlike
 * `app/[locale]/[slug]/page.tsx`'s `DynamicPages` (which needs a parallel SEO fetch just to
 * get a page title for its breadcrumb), a second fetch here would be redundant —
 * `getAllSeoContent` stays solely in `generateMetadata`, where it's actually needed
 * for OG/canonical/etc. `readingTime` comes from `post.seo` directly instead (fetched
 * as part of `getPostContentBySlug`'s own query). Post reactions (`getPostReactions`),
 * comments (`getPostComments`), and comment-level reactions (`getCommentReactions`)
 * are each fetched separately with their own short cache lifetimes — see those
 * functions' own doc comments for why.
 *
 * `params` is awaited before use because Next.js's App Router passes route params as
 * a Promise for async server components.
 *
 * `post.title`/`post.excerpt`/`post.content` are machine-translated for
 * non-English locales via `translateFields` (a no-op for English) before
 * `extractToc`/the structured-data builders/the rest of this component ever
 * see them — so the table of contents, JSON-LD, and rendered article are all
 * built from the same translated content, not a mix of translated and
 * English. `content` is flagged as HTML (`textType=html`) since it's WP's
 * raw rendered post body, not plain text.
 *
 * @param params - Route params promise; resolves to `{locale, slug}` for the current post.
 */
const SinglePostPage = async ({ params }: { params: Promise<{ locale: string; slug: string }> }) => {

	/* Extract slug directly from params to ensure it's resolved before use. */
	const { slug } = await params;

	// getPostContentBySlug throws on a network/fetch-level failure, not just a
	// resolved-undefined GraphQL error — caught here so a CMS blip 404s cleanly
	// instead of surfacing as an unhandled 500.
	let post: IPost.IProps | undefined;

	try {
		post = await getPostContentBySlug(slug);
	} catch (error) {
		console.log(error);
	}

	if (!post) {
		notFound();
	}

	post = {
		...post,
		...(await translateFields(
			{ title: post.title, excerpt: post.excerpt, content: post.content },
			['content'],
		)),
	};

	// getPostReactions and getPostComments don't depend on each other's result,
	// so they run in parallel rather than as two sequential round trips. Both
	// resolve to undefined (reactions shown as 0/0, comments as an empty list)
	// on failure — including the mu-plugin not being installed yet for
	// reactions, an expected state, not an error — so neither is wrapped in
	// try/catch the way getPostContentBySlug is above.
	const [reactions, comments] = await Promise.all([
		getPostReactions(post.databaseId),
		// Isolated from getPostContentBySlug with its own short cache so a
		// freshly approved comment shows up quickly instead of waiting on the
		// post-content query's much longer cache lifetime — see
		// GetPostComments.ts's doc comment.
		getPostComments(post.databaseId),
	]);

	// Comment-level like/dislike counts are fetched in one batched call for
	// every comment/reply on the page (rather than one request per comment),
	// isolated the same way post reactions are — see GetCommentReactions.ts's
	// doc comment.
	const commentDatabaseIds = (comments?.comments ?? []).flatMap((comment) => [
		comment.databaseId,
		...(comment.replies?.nodes.map((reply) => reply.databaseId) ?? []),
	]);
	const commentReactions = (await getCommentReactions(commentDatabaseIds)) ?? {};

	const { headings, contentWithAnchors } = extractToc(post.content);

	const breadcrumbSchema = buildBreadcrumbListSchema({
		siteUrl: SITE_URL!,
		slug: `posts/${slug}`,
		pageTitle: post.title,
	});

	const articleSchema = buildArticleSchema({
		siteUrl: SITE_URL!,
		slug,
		post,
	});

	return (
		<article className={styles.singlePost}>
			<StructuredData data={[breadcrumbSchema, articleSchema]} />

			<Breadcrumbs postTitle={post.title} />

			<PostHero
				post={post}
				initialLikes={reactions?.likes ?? 0}
				initialDislikes={reactions?.dislikes ?? 0}
				commentCount={comments?.commentCount ?? 0}
			/>

			<div className={styles.postBody}>
				<aside className={styles.postSidebar}>
					<TableOfContents headings={headings} />
					<ShareLinks />
				</aside>
				<div className={styles.postMain}>
					<ArticleContent content={contentWithAnchors} />
				</div>
			</div>

			<CommentsFeed
				postId={post.databaseId}
				comments={comments?.comments ?? []}
				commentReactions={commentReactions}
			/>
			<CommentForm postId={post.databaseId} />

			<LatestPosts excludePostId={post.databaseId} />
		</article>
	);
}

SinglePostPage.displayName = 'SinglePostPage';

export default SinglePostPage;
