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

// CMS content translation + locale-aware SEO
import { translateFields } from "@/i18n/translateContent";
import { buildLocaleAlternates } from "@/i18n/buildAlternates";

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
 * SEO text fields are machine-translated for non-English locales via
 * `translateFields` (a no-op for English). `alternates` is rebuilt via
 * `buildLocaleAlternates` rather than trusting Yoast's raw un-prefixed
 * `seo.canonical`.
 * @param params - Route params promise; resolves to `{locale}`.
 * @returns Next.js `Metadata` for the home page.
 */
export const generateMetadata = async ({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> => {

  const { locale } = await params;
  const seo = await getAllSeoContent(pageType?.home, postType.pages) as ISeo.IProps;

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
		alternates: buildLocaleAlternates(locale, ''),
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
 * Renders the home page. Same CMS flexible-content pipeline as `app/[locale]/[slug]/page.tsx`
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