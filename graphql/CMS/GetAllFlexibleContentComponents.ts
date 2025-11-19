/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { client } from "@/config/apollo";
import { ApolloClient, DocumentNode, gql } from "@apollo/client";
import * as IFlexibleContent from "@/graphql/CMS/types/flexibleContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX GraphQL Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { TitleParagraph } from "@/components/CMS/TitleParagraph/graphql/index";

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
): Promise<IFlexibleContent.IProps | null> => {
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
                							... on ${postTypeFlexibleContent}_TitleParagraph {${TitleParagraph}}
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

		// 1. Check if data object or errors exist
        if (!response.data || response.error) {
            console.error("GraphQL query failed or returned data errors.", response.error);
            return null;
		}
		
		// Destructure to safely access the nested data and explicitly check for it.
		const pageEdges = response.data.flexibleComponents?.edges;
		
		// 2. Check if the edges array is empty or undefined (meaning the page wasn't found)
        if (!pageEdges || pageEdges.length === 0) {
            console.log(`No content found for slug: ${slug}`);
            return null;
		}
		
		// Safely extract the deep array structure using optional chaining, 
        // relying on the type definitions to guide the path.
        const flexibleContentArray = 
            pageEdges[0].node?.template?.flexibleContent?.flexibleContent;

		return flexibleContentArray as IFlexibleContent.IProps;

	} catch (error) {
		console.log(error);
		throw new Error(
			"Something went wrong trying to fetch all flexible content components"
		);
	}
};
