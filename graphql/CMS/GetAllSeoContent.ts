/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as ISeo from "@/graphql/CMS/types/seo";
import { IGraphQLResponse } from "@/graphql/CMS/types/graphqlResponse";

const GRAPHQL_ENDPOINT: string | undefined = process.env.NEXT_PUBLIC_CMS_API_URL;
if (!GRAPHQL_ENDPOINT) throw new Error("NEXT_PUBLIC_CMS_API_URL not defined.");

/**
 * Fetches the Yoast SEO metadata (canonical, Open Graph, Twitter Card, etc.)
 * for a single page or blog post, used to populate that page's `<head>` metadata.
 * Works for both pages and blog posts since the post type is passed in.
 * @param slug The slug of the page or post to fetch SEO data for.
 * @param postType The WP post type to query (e.g., 'pages', 'posts').
 * @returns A promise resolving to the SEO fields object, or `undefined` if the fetch/query failed.
 */
export const getAllSeoContent = async (
	slug: string,
	postType: string
): Promise<ISeo.IProps | unknown> => {
	try {
		const content = `
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

		const nextJSFetchResponse: Response = await fetch(GRAPHQL_ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query: content }),
			next: { revalidate: 86400 },
		});

		if (!nextJSFetchResponse.ok) {
			console.error(`SEO content fetch failed with status: ${nextJSFetchResponse.status}`);
			return undefined;
		}

		const response: IGraphQLResponse<ISeo.IResponse> = await nextJSFetchResponse.json();

		if (response.errors) {
			console.error(`SEO content query for slug "${slug}" returned errors:`, response.errors);
			return undefined;
		}

		return response?.data?.seo?.edges?.[0]?.node?.seo;

	} catch (error: unknown) {
		console.log(error);
		throw new Error(
			`Something went wrong trying to fetch all ${postType} seo content per page`
		);
	}
};
