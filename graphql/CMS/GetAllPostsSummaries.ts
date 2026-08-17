/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IPost from "@/graphql/CMS/types/post";
import { IGraphQLResponse } from "@/graphql/CMS/types/graphqlResponse";

const GRAPHQL_ENDPOINT: string | undefined = process.env.NEXT_PUBLIC_CMS_API_URL;
if (!GRAPHQL_ENDPOINT) throw new Error("NEXT_PUBLIC_CMS_API_URL not defined.");

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX POSTS SUMMARIES XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Fetches a page of published post summaries (title, slug, date, excerpt, featured
 * image) for the blog archive grid, using WPGraphQL's Relay-style cursor pagination
 * on the `posts` connection. `pageInfo` is always returned even though the current
 * `AllBlogPosts` block doesn't render a "Load more" control — keeping the
 * cursor/pageInfo shape wired through now means a future paginated UI only needs to
 * call this again with `after`, not change the query.
 * @param first Page size.
 * @param after Optional end cursor from a previous page, for future pagination.
 * @returns A promise resolving to `{ posts, pageInfo }`, or `undefined` on failure.
 */
export const getAllPostsSummaries = async (
	first: number = 24,
	after?: string,
): Promise<{ posts: IPost.ISummaryProps[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } | undefined> => {
	try {
		const afterArg = after ? `, after: "${after}"` : '';

		const content = `
			{
				posts(first: ${first}${afterArg}, where: {status: PUBLISH}) {
					nodes {
						title
						slug
						date
						excerpt
						featuredImage {
							node {
								sourceUrl
								altText
							}
						}
					}
					pageInfo {
						hasNextPage
						endCursor
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
			console.error(`Posts summaries fetch failed with status: ${nextJSFetchResponse.status}`);
			return undefined;
		}

		const response: IGraphQLResponse<IPost.ISummaryResponse> = await nextJSFetchResponse.json();

		if (response.errors) {
			console.error("Posts summaries query returned errors:", response.errors);
			return undefined;
		}

		if (!response?.data?.posts) return undefined;

		return { posts: response.data.posts.nodes, pageInfo: response.data.posts.pageInfo };

	} catch (error: unknown) {
		console.log(error);
		throw new Error("Something went wrong trying to fetch all posts summaries");
	}
};
