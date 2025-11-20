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
import { getAllFlexibleContentComponents } from "@/graphql/CMS/GetAllFlexibleContentComponents";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import PageContextProvider from "@/context/providers/PageContextProvider";
import RenderFlexibleContent from "@/components/CMS/FlexibleContent/RenderFlexibleContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Metadata XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

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

const HomePage: NextPage = async () => {
  // Fetch priority content
  const flexibleContentComponents = await getAllFlexibleContentComponents(
  	pageType.home,
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

HomePage.displayName = 'HomePage';

export default HomePage;