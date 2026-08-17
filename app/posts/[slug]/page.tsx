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

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import ArticleContent from "@/components/Global/Elements/ArticleContent/ArticleContent";
import { extractToc } from "@/components/Global/Elements/ArticleContent/extractToc";
import LatestPosts from "@/components/Global/Elements/LatestPosts/LatestPosts";
import PostHero from "@/app/posts/[slug]/fragments/PostHero";
import TableOfContents from "@/app/posts/[slug]/fragments/TableOfContents";
import ShareLinks from "@/app/posts/[slug]/fragments/ShareLinks";
import CommentsFeed from "@/app/posts/[slug]/fragments/CommentsFeed";
import CommentForm from "@/app/posts/[slug]/fragments/CommentForm";

// Structured Data (JSON-LD)
import StructuredData from "@/components/Global/StructuredData/StructuredData";
import { buildArticleSchema, buildBreadcrumbListSchema } from "@/components/Global/StructuredData/builders";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/app/posts/[slug]/styles/SinglePost.module.css";

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
 * @param params - Route params promise; resolves to `{slug}` for the current post.
 * @returns Next.js `Metadata` for this post.
 */
export const generateMetadata = async ({ params }: { params: { slug: string } }): Promise<Metadata> => {

	const { slug } = await params;

	const seo = await getAllSeoContent(slug, postType.posts) as ISeo.IProps;

	return {
		title: seo.title,
		description: seo.metaDesc,
		openGraph: {
			type: 'website',
			url: seo.opengraphUrl,
			title: seo.opengraphTitle,
			siteName: seo.opengraphSiteName,
			description: seo.opengraphDescription
		},
		alternates: {
			canonical: seo?.canonical,
		},
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
 * Unlike `app/[slug]/page.tsx`, this route does not go through the ACF
 * flexible-content pipeline — a blog post is standard WP post content, not an ACF
 * block composition — so it fetches `getPostContentBySlug` directly and renders it.
 *
 * `getPostContentBySlug` already returns the post's own `title`, so unlike
 * `app/[slug]/page.tsx`'s `DynamicPages` (which needs a parallel SEO fetch just to
 * get a page title for its breadcrumb), a second fetch here would be redundant —
 * `getAllSeoContent` stays solely in `generateMetadata`, where it's actually needed
 * for OG/canonical/etc. `readingTime` comes from `post.seo` directly instead (fetched
 * as part of `getPostContentBySlug`'s own query). Reactions (`getPostReactions`) and
 * comments (`getPostComments`) are each fetched separately with their own short
 * cache lifetimes — see those functions' own doc comments for why.
 *
 * `params` is awaited before use because Next.js's App Router passes route params as
 * a Promise for async server components.
 *
 * @param params - Route params promise; resolves to `{slug}` for the current post.
 */
const SinglePostPage = async ({ params }: { params: { slug: string } }) => {

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

	// getPostReactions resolves to undefined (shown as 0/0) when the simple-blogs-post-likes
	// mu-plugin isn't installed yet — an expected state, not an error, so it's
	// awaited plainly rather than wrapped in try/catch like getPostContentBySlug.
	const reactions = await getPostReactions(post.databaseId);

	// Isolated from getPostContentBySlug with its own short cache so a freshly
	// approved comment shows up quickly instead of waiting on the post-content
	// query's much longer cache lifetime — see GetPostComments.ts's doc comment.
	const comments = await getPostComments(post.databaseId);

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

			<CommentsFeed postId={post.databaseId} comments={comments?.comments ?? []} />
			<CommentForm postId={post.databaseId} />

			<LatestPosts excludePostId={post.databaseId} />
		</article>
	);
}

SinglePostPage.displayName = 'SinglePostPage';

export default SinglePostPage;
