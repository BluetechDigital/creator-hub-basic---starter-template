/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { Metadata } from "next";
import * as ISeo from "@/graphql/CMS/types/seo";
import { postType, flexibleContentType } from "@/context/constants";
import * as IFlexibleContent from "@/graphql/CMS/types/flexibleContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Queries Functions XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { getAllSeoContent } from "@/graphql/CMS/GetAllSeoContent";
import { getAllPageACFFlexibleComponentsContent } from "@/graphql/CMS/GetAllPageACFFlexibleComponentsContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import RenderFlexibleContent from "@/components/CMS/FlexibleContent/RenderFlexibleContent";

// Structured Data (JSON-LD)
import StructuredData from "@/components/Global/StructuredData/StructuredData";
import { buildBreadcrumbListSchema } from "@/components/Global/StructuredData/builders";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const SITE_URL: string | undefined = process.env.SITE_URL;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Metadata XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Builds Next.js `<head>` metadata (title, description, Open Graph, canonical, robots)
 * for a CMS-driven page identified by its slug, by querying WPGraphQL SEO fields for
 * that slug.
 *
 * `params` is awaited before use because Next.js's App Router passes route params as a
 * Promise for async server components/functions — `params` must be resolved before its
 * `slug` property can be read.
 *
 * @param params - Route params promise; resolves to `{slug}` for the current page.
 * @returns Next.js `Metadata` for this page.
 */
export const generateMetadata = async ({ params }: { params: { slug: string } }): Promise<Metadata> => {
	
	const { slug } = await params;

	const seo = await getAllSeoContent(slug, postType.pages) as ISeo.IProps;

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
XXXXXXXXXXXXXXXXXXXXXXXXX Dynamic Pages Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders a CMS-driven page for the given slug. This is the entry point for the CMS
 * flexible-content pipeline documented in `ARCHITECTURE.md` §1: it fetches the page's
 * ACF flexible-content blocks (via a two-pass GraphQL query in
 * `getAllPageACFFlexibleComponentsContent`) and its SEO/breadcrumb data, and hands the
 * block data straight to `RenderFlexibleContent`, which resolves each block to a
 * component via `DynamicComponentLoaders` further down the tree — no per-page React
 * code is written here or per-page-type.
 *
 * Content and SEO are fetched in parallel via `Promise.all` since neither depends on the
 * other's result, avoiding a sequential network round-trip.
 *
 * `params` is awaited before use because Next.js's App Router passes route params as a
 * Promise for async server components — `params` must be resolved before its `slug`
 * property can be read.
 *
 * @param params - Route params promise; resolves to `{slug}` for the current page.
 */
const DynamicPages = async ({ params }: { params: { slug: string } }) => {
	
	/* Extract slug directly from params to ensure it's resolved before use. */
	const { slug } = await params;

  	// Current Page ACF Flexible Components Content
	const [pageACFFlexibleComponentsContent, seo] = await Promise.all([
		getAllPageACFFlexibleComponentsContent(
			slug,
			postType.pages,
			flexibleContentType.pages
		) as Promise<IFlexibleContent.IProps>,
		getAllSeoContent(slug, postType.pages) as Promise<ISeo.IProps>,
	]);

	const breadcrumbSchema = buildBreadcrumbListSchema({
		siteUrl: SITE_URL!,
		slug,
		pageTitle: seo.title,
	});

	return (
		<>
			<StructuredData data={breadcrumbSchema} />
			<RenderFlexibleContent content={pageACFFlexibleComponentsContent} />
		</>
	);
}

DynamicPages.displayName = 'DynamicPages';

export default DynamicPages;