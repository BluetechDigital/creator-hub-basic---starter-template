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

import PageContextProvider from "@/context/providers/PageContextProvider";
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
		<PageContextProvider
			content={pageACFFlexibleComponentsContent}
			postTypeFlexibleContent={flexibleContentType.pages}
		>
			<StructuredData data={breadcrumbSchema} />
			<RenderFlexibleContent />
		</PageContextProvider>
	);
}

DynamicPages.displayName = 'DynamicPages';

export default DynamicPages;