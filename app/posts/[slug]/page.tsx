/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { Metadata } from "next";
import Image from "next/image";
import dateFormat from "dateformat";
import { notFound } from "next/navigation";
import * as ISeo from "@/graphql/CMS/types/seo";
import * as IPost from "@/graphql/CMS/types/post";
import { postType } from "@/context/constants";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Queries Functions XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { getAllSeoContent } from "@/graphql/CMS/GetAllSeoContent";
import { getPostContentBySlug } from "@/graphql/CMS/GetPostContentBySlug";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import ArticleContent from "@/components/Global/Elements/ArticleContent/ArticleContent";
import { extractToc } from "@/components/Global/Elements/ArticleContent/extractToc";
import LatestPosts from "@/components/Global/Elements/LatestPosts/LatestPosts";
import TableOfContents from "@/app/posts/[slug]/fragments/TableOfContents";
import ShareLinks from "@/app/posts/[slug]/fragments/ShareLinks";

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
 * as part of `getPostContentBySlug`'s own query).
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

	const { headings, contentWithAnchors } = extractToc(post.content);

	const postUrl = `${SITE_URL ?? ''}/posts/${slug}`;

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

			<header className={styles.postHero}>
				<div className={styles.postHeroInner}>
					{post.featuredImage?.node?.sourceUrl && (
						<div className={styles.postHeroImageWrapper}>
							<Image
								src={post.featuredImage.node.sourceUrl}
								alt={post.featuredImage.node.altText || post.title}
								width={720}
								height={640}
								className={styles.postHeroImage}
								priority
							/>
						</div>
					)}
					<div className={styles.postHeroContent}>
						<h1 className={styles.postTitle}>{post.title}</h1>
						{post.excerpt && (
							<p className={styles.postExcerpt}>
								{post.excerpt.replace(/<[^>]+>/g, '').trim()}
							</p>
						)}
						<div className={styles.postMeta}>
							{post.author?.node?.avatar?.url && (
								<Image
									src={post.author.node.avatar.url}
									alt={post.author.node.name}
									width={32}
									height={32}
									className={styles.postAuthorAvatar}
								/>
							)}
							{post.author?.node?.name && (
								<span className={styles.postMetaText}>{post.author.node.name}</span>
							)}
							<span className={styles.postMetaDot} aria-hidden="true" />
							<span className={styles.postMetaText}>{dateFormat(post.date, "mmmm dS, yyyy")}</span>
							{post.seo?.readingTime ? (
								<>
									<span className={styles.postMetaDot} aria-hidden="true" />
									<span className={styles.postMetaText}>{post.seo.readingTime} min read</span>
								</>
							) : null}
						</div>
					</div>
				</div>
			</header>

			<div className={styles.postBody}>
				<aside className={styles.postSidebar}>
					<TableOfContents headings={headings} />
					<ShareLinks url={postUrl} title={post.title} />
				</aside>
				<div className={styles.postMain}>
					<ArticleContent content={contentWithAnchors} />
				</div>
			</div>

			<LatestPosts excludePostId={post.databaseId} />
		</article>
	);
}

SinglePostPage.displayName = 'SinglePostPage';

export default SinglePostPage;
