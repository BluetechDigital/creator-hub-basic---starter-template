/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { Metadata, NextPage } from "next";
import { notFound } from "next/navigation";
import * as ISeo from "@/graphql/CMS/types/seo";
import * as IFlexibleContent from "@/graphql/CMS/types/flexibleContent";
import { postType, flexibleContentType, pageType } from "@/context/constants";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Queries Functions XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { getAllSeoContent } from "@/graphql/CMS/GetAllSeoContent";
import { getAllPageACFFlexibleComponentsContent } from "@/graphql/CMS/GetAllPageACFFlexibleComponentsContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import RenderFlexibleContent from "@/components/CMS/FlexibleContent/RenderFlexibleContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Metadata XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Builds Next.js `<head>` metadata (title, description, Open Graph, canonical, robots)
 * for the blog archive page, by querying WPGraphQL SEO fields for `pageType.posts`.
 *
 * @returns Next.js `Metadata` for the blog archive page, or minimal no-index metadata
 * if the WP "Blog" page this route depends on doesn't exist yet (a fresh fork, before
 * anyone's created it) — `PostsArchivePage` below is what actually 404s; this just has
 * to avoid crashing on `seo` being `undefined` in the meantime (same pattern as
 * `app/[slug]/page.tsx`'s `generateMetadata`).
 */
export const generateMetadata = async (): Promise<Metadata> => {

	const seo = await getAllSeoContent(pageType?.posts, postType.pages) as ISeo.IProps | undefined;

	if (!seo) {
		return { robots: { follow: false, index: false } };
	}

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
XXXXXXXXXXXXXXXXXXXXXXXXXX Blog Archive Page Component XXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders the blog archive page. Same CMS flexible-content pipeline as
 * `app/[slug]/page.tsx` (see `ARCHITECTURE.md` §1), fixed to `pageType.posts` — the
 * WP *Page* that hosts the archive, not to be confused with `postType.posts` (the WP
 * post type queried by the `AllBlogPosts` block below for the actual posts). It
 * fetches this page's ACF flexible-content blocks via
 * `getAllPageACFFlexibleComponentsContent` and hands them straight to
 * `RenderFlexibleContent`, which resolves each block to a component via
 * `DynamicComponentLoaders` further down the tree — including `AllBlogPosts`, which
 * a CMS editor places on this page to render the actual grid.
 *
 * `getAllPageACFFlexibleComponentsContent` resolves to `null` if the WP "Blog" page
 * doesn't exist yet (a fresh fork, before anyone's created it in wp-admin) or on a
 * network-level failure — both cases 404 cleanly here instead of `RenderFlexibleContent`
 * crashing on a `null` `content` prop, matching `app/[slug]/page.tsx`'s `DynamicPages`.
 */
const PostsArchivePage: NextPage = async () => {

	let pageACFFlexibleComponentsContent: IFlexibleContent.IProps | null = null;

	try {
		pageACFFlexibleComponentsContent = await getAllPageACFFlexibleComponentsContent(
			pageType.posts,
			postType.pages,
			flexibleContentType.pages
		) as IFlexibleContent.IProps | null;
	} catch (error) {
		console.log(error);
	}

	if (!pageACFFlexibleComponentsContent) {
		notFound();
	}

	return <RenderFlexibleContent content={pageACFFlexibleComponentsContent} />;
}

PostsArchivePage.displayName = 'PostsArchivePage';

export default PostsArchivePage;
