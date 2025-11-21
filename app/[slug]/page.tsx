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
import { getAllFlexibleContentComponents } from "@/graphql/CMS/GetAllFlexibleContentComponents";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import PageContextProvider from "@/context/providers/PageContextProvider";
import RenderFlexibleContent from "@/components/CMS/FlexibleContent/RenderFlexibleContent";

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

	// Fetch priority content
	const flexibleContentComponents = await getAllFlexibleContentComponents(
		slug,
		postType.pages,
		flexibleContentType.pages
	) as IFlexibleContent.IProps;

		return (
		<PageContextProvider
			content={flexibleContentComponents}
			postTypeFlexibleContent={flexibleContentType.pages}
		>
			<RenderFlexibleContent />
		</PageContextProvider>
	);
}

	DynamicPages.displayName = 'DynamicPages';

export default DynamicPages;