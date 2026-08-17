/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IPost from "@/graphql/CMS/types/post";
import { IGraphQLResponse } from "@/graphql/CMS/types/graphqlResponse";

const GRAPHQL_ENDPOINT: string | undefined = process.env.NEXT_PUBLIC_CMS_API_URL;
if (!GRAPHQL_ENDPOINT) throw new Error("NEXT_PUBLIC_CMS_API_URL not defined.");

/**
 * Fetches a single published blog post's rendering content (title, body, featured
 * image, author, categories) by slug. SEO metadata is fetched separately via the
 * already-generic `getAllSeoContent(slug, postType.posts)` — this function only
 * covers the fields the post's own body/breadcrumb rendering needs.
 * @param slug The slug of the post to fetch content for.
 * @returns A promise resolving to the post's content fields, or `undefined` if the fetch/query failed or no post matched.
 */
export const getPostContentBySlug = async (slug: string): Promise<IPost.IProps | undefined> => {
	try {
		const content = `
			{
				posts(where: {name: "${slug}", status: PUBLISH}) {
					edges {
						node {
							databaseId
							title
							slug
							date
							modified
							content
							excerpt
							featuredImage {
								node {
									sourceUrl
									altText
								}
							}
							author {
								node {
									name
									avatar {
										url
									}
								}
							}
							categories {
								nodes {
									name
									slug
								}
							}
							seo {
								readingTime
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
			console.error(`Post content fetch failed with status: ${nextJSFetchResponse.status}`);
			return undefined;
		}

		const response: IGraphQLResponse<IPost.IResponse> = await nextJSFetchResponse.json();

		if (response.errors) {
			console.error(`Post content query for slug "${slug}" returned errors:`, response.errors);
			return undefined;
		}

		return response?.data?.posts?.edges?.[0]?.node;

	} catch (error: unknown) {
		console.log(error);
		throw new Error(
			`Something went wrong trying to fetch post content for slug "${slug}"`
		);
	}
};
