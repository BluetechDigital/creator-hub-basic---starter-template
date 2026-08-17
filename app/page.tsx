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

import RenderFlexibleContent from "@/components/CMS/FlexibleContent/RenderFlexibleContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Metadata XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Builds Next.js `<head>` metadata (title, description, Open Graph, canonical, robots)
 * for the home page, by querying WPGraphQL SEO fields for `pageType.home`.
 *
 * @returns Next.js `Metadata` for the home page.
 */
export const generateMetadata = async (): Promise<Metadata> => {

  const seo = await getAllSeoContent(pageType?.home, postType.pages) as ISeo.IProps;

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
XXXXXXXXXXXXXXXXXXXXXXXXXXXX Home Page Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders the home page. Same CMS flexible-content pipeline as `app/[slug]/page.tsx`
 * (see `ARCHITECTURE.md` §1), fixed to `pageType.home` instead of a route param: it
 * fetches this page's ACF flexible-content blocks via
 * `getAllPageACFFlexibleComponentsContent` and hands them straight to
 * `RenderFlexibleContent`, which resolves each block to a component via
 * `DynamicComponentLoaders` further down the tree.
 */
const HomePage: NextPage = async () => {

  // Current Page ACF Flexible Components Content
  const pageACFFlexibleComponentsContent = await getAllPageACFFlexibleComponentsContent(
  	pageType.home,
  	postType.pages,
  	flexibleContentType.pages
  ) as IFlexibleContent.IProps;

  return <RenderFlexibleContent content={pageACFFlexibleComponentsContent} />;
}

HomePage.displayName = 'HomePage';

export default HomePage;