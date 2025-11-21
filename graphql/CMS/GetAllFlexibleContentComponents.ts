/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { client } from "@/config/apollo";
import { ApolloClient, DocumentNode, gql } from "@apollo/client";
import * as IFlexibleContent from "@/graphql/CMS/types/flexibleContent";

// Components: ACF Flexible Content Post Types
import { Hero } from "@/components/CMS/Hero/graphql/index";
import { HeroTwo } from "@/components/CMS/HeroTwo/graphql/index";
import { AboutUs } from "@/components/CMS/AboutUs/graphql/index";
import { CallToAction } from "@/components/CMS/CallToAction/graphql/index";
import { InstagramFeed } from "@/components/CMS/InstagramFeed/graphql/index";
import { TitleParagraph } from "@/components/CMS/TitleParagraph/graphql/index";
import { CallToActionTwo } from "@/components/CMS/CallToActionTwo/graphql/index";
import { SponsorshipInfo } from "@/components/CMS/SponsorshipInfo/graphql/index";
import { YoutubeVideoGrid } from "@/components/CMS/YoutubeVideoGrid/graphql/index";
import { AllYoutubeVideos } from "@/components/CMS/AllYoutubeVideos/graphql/index";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXX Function to fetch all flexible content components XXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/* Fetch all ACF Flexible Content Type (pages or posts) Components 

 1. postType: pages or posts (For every flexible content page)
 2. postTypeFlexibleContent: ACF Flexible Content Type (pages or posts) */

export const getAllFlexibleContentComponents = async (
	slug: string,
	postType: string,
	postTypeFlexibleContent: string

): Promise<IFlexibleContent.IProps | unknown> => {
	try {
		const content: DocumentNode = gql`
			{
        		flexibleComponents: ${postType}(where: {name: "${slug}", status: PUBLISH}) {
        		  edges {
						node {
							template {
								... on DefaultTemplate {
									flexibleContent {
										flexibleContent {
											... on ${postTypeFlexibleContent}_Hero {${Hero}}
											... on ${postTypeFlexibleContent}_HeroTwo {${HeroTwo}}
											... on ${postTypeFlexibleContent}_AboutUs {${AboutUs}}
											... on ${postTypeFlexibleContent}_CallToAction {${CallToAction}}
											... on ${postTypeFlexibleContent}_InstagramFeed {${InstagramFeed}}
											... on ${postTypeFlexibleContent}_TitleParagraph {${TitleParagraph}}
											... on ${postTypeFlexibleContent}_CallToActionTwo {${CallToActionTwo}}
											... on ${postTypeFlexibleContent}_SponsorshipInfo {${SponsorshipInfo}}
											... on ${postTypeFlexibleContent}_YoutubeVideoGrid {${YoutubeVideoGrid}}
											... on ${postTypeFlexibleContent}_AllYoutubeVideos {${AllYoutubeVideos}}
										}
									}
								}
							}
						}
					}
        		}
			}
		`;

		const response: ApolloClient.QueryResult<IFlexibleContent.IQueryResponse> = await client.query<IFlexibleContent.IQueryResponse>({
			query: content,
		});

		// 1. Check for data and errors
        if (!response.data || response.error) {
            console.error("GraphQL query failed or returned data errors.", response.error);
            return null;
		}
		
		// 2. Safely extract the deep array structure
        const flexibleContentArray = 
            response.data.flexibleComponents?.edges?.[0]?.node?.template?.flexibleContent?.flexibleContent;

		// 3. Check if content was actually retrieved
        if (!flexibleContentArray) {
            console.log(`No flexible content found for slug: ${slug}`);
            return null;
		}

		return flexibleContentArray as IFlexibleContent.IProps;
	} catch (error) {
		console.log(error);
		throw new Error(
			"Something went wrong trying to fetch all flexible content components"
		);
	}
};
