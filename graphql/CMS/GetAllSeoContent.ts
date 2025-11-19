/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { client } from "@/config/apollo";
import * as ISeo from "@/graphql/CMS/types/seo";
import { ApolloClient, DocumentNode, gql } from "@apollo/client";

/* PAGES & BLOGS POSTS*/
/* Fetch all Seo Content (For 
	every flexible content page) */
export const getAllSeoContent = async (
	slug: string,
	postType: string
): Promise<ISeo.IProps | unknown> => {
	try {
		const content: DocumentNode = gql`
			{
				seo: ${postType}(where: {name: "${slug}", status: PUBLISH}) {
					edges {
						node {
							seo {
								canonical
								cornerstone
								focuskw
								fullHead
								metaDesc
								metaKeywords
								metaRobotsNofollow
								metaRobotsNoindex
								opengraphAuthor
								opengraphDescription
								opengraphImage {
									mediaItemUrl
								}
								opengraphModifiedTime
								opengraphPublishedTime
								opengraphPublisher
								opengraphSiteName
								opengraphTitle
								opengraphType
								opengraphUrl
								readingTime
								title
								twitterDescription
								twitterTitle
								twitterImage {
									mediaItemUrl
								}
							}
						}
					}
				}
			}
		`;

		const response: ApolloClient.QueryResult<ISeo.IResponse> = await client.query<ISeo.IResponse>({
			query: content,
		});

		return response?.data?.seo?.edges?.[0]?.node?.seo;

	} catch (error: unknown) {
		console.log(error);
		throw new Error(
			`Something went wrong trying to fetch all ${postType} seo content per page`
		);
	}
};
