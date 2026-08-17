/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { Metadata, NextPage } from "next";
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

import PageContextProvider from "@/context/providers/PageContextProvider";
import RenderFlexibleContent from "@/components/CMS/FlexibleContent/RenderFlexibleContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Metadata XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Builds Next.js `<head>` metadata (title, description, Open Graph, canonical, robots)
 * for the blog archive page, by querying WPGraphQL SEO fields for `pageType.posts`.
 *
 * @returns Next.js `Metadata` for the blog archive page.
 */
export const generateMetadata = async (): Promise<Metadata> => {

  const seo = await getAllSeoContent(pageType?.posts, postType.pages) as ISeo.IProps;

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
 * `getAllPageACFFlexibleComponentsContent`, hands them down through
 * `PageContextProvider`, and lets `RenderFlexibleContent` resolve each block to a
 * component via `DynamicComponentLoaders` further down the tree — including
 * `AllBlogPosts`, which a CMS editor places on this page to render the actual grid.
 */
const PostsArchivePage: NextPage = async () => {

  // Current Page ACF Flexible Components Content
  const pageACFFlexibleComponentsContent = await getAllPageACFFlexibleComponentsContent(
  	pageType.posts,
  	postType.pages,
  	flexibleContentType.pages
  ) as IFlexibleContent.IProps;

  return (
    <PageContextProvider
      content={pageACFFlexibleComponentsContent}
      postTypeFlexibleContent={flexibleContentType.pages}
    >
      <RenderFlexibleContent />
	</PageContextProvider>
  );
}

PostsArchivePage.displayName = 'PostsArchivePage';

export default PostsArchivePage;
