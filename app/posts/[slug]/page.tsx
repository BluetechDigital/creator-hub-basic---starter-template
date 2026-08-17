/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { Metadata } from "next";
import Image from "next/image";
import dateFormat from "dateformat";
import { notFound } from "next/navigation";
import * as ISeo from "@/graphql/CMS/types/seo";
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
 * Renders a single blog post for the given slug: a header (title, date, author,
 * featured image) followed by the sanitized body. Unlike `app/[slug]/page.tsx`, this
 * route does not go through the ACF flexible-content pipeline — a blog post is
 * standard WP post content (title/body/featured image), not an ACF block
 * composition — so it fetches `getPostContentBySlug` directly and renders it.
 *
 * `getPostContentBySlug` already returns the post's own `title`, so unlike
 * `app/[slug]/page.tsx`'s `DynamicPages` (which needs a parallel SEO fetch just to
 * get a page title for its breadcrumb), a second fetch here would be redundant —
 * `getAllSeoContent` stays solely in `generateMetadata`, where it's actually needed
 * for OG/canonical/etc.
 *
 * `params` is awaited before use because Next.js's App Router passes route params as
 * a Promise for async server components.
 *
 * @param params - Route params promise; resolves to `{slug}` for the current post.
 */
const SinglePostPage = async ({ params }: { params: { slug: string } }) => {

	/* Extract slug directly from params to ensure it's resolved before use. */
	const { slug } = await params;

	const post = await getPostContentBySlug(slug);

	if (!post) {
		notFound();
	}

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
		<article>
			<StructuredData data={[breadcrumbSchema, articleSchema]} />
			<header className={styles.postHeader}>
				<h1 className={styles.postTitle}>{post.title}</h1>
				<span className={styles.postMeta}>
					{dateFormat(post.date, "mmmm dS, yyyy")}
					{post.author?.node?.name ? ` · ${post.author.node.name}` : ''}
				</span>
				{post.featuredImage?.node?.sourceUrl && (
					<Image
						src={post.featuredImage.node.sourceUrl}
						alt={post.featuredImage.node.altText || post.title}
						width={1200}
						height={630}
						className={styles.postFeaturedImage}
						priority
					/>
				)}
			</header>
			<ArticleContent content={post.content} />
		</article>
	);
}

SinglePostPage.displayName = 'SinglePostPage';

export default SinglePostPage;
