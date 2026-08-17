/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IPost from "@/graphql/CMS/types/post";
import { IGraphQLResponse } from "@/graphql/CMS/types/graphqlResponse";

const GRAPHQL_ENDPOINT: string | undefined = process.env.NEXT_PUBLIC_CMS_API_URL;
if (!GRAPHQL_ENDPOINT) throw new Error("NEXT_PUBLIC_CMS_API_URL not defined.");

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX LATEST POSTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Fetches the most recent published posts, excluding one post by its `databaseId` —
 * used by the single-post page's "Latest news" section so the article currently being
 * read never appears in its own related-posts list. `notIn` + `orderby: {field: DATE,
 * order: DESC}` are both confirmed-working WPGraphQL `posts` connection where-args
 * (verified directly against the live endpoint, not introspection, which is disabled
 * here) — newest-first is WPGraphQL's own default order for this connection, but it's
 * specified explicitly rather than relied upon.
 * @param excludeId The `databaseId` of the post to exclude (the one currently being viewed).
 * @param first How many posts to return.
 * @returns A promise resolving to the post summaries, or `undefined` on failure.
 */
export const getLatestPosts = async (
	excludeId: number,
	first: number = 3,
): Promise<IPost.ISummaryProps[] | undefined> => {
	try {
		const content = `
			{
				posts(first: ${first}, where: {status: PUBLISH, notIn: [${excludeId}], orderby: {field: DATE, order: DESC}}) {
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
		`;

		const nextJSFetchResponse: Response = await fetch(GRAPHQL_ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query: content }),
			next: { revalidate: 86400 },
		});

		if (!nextJSFetchResponse.ok) {
			console.error(`Latest posts fetch failed with status: ${nextJSFetchResponse.status}`);
			return undefined;
		}

		const response: IGraphQLResponse<{ posts: { nodes: IPost.ISummaryProps[] } | null }> = await nextJSFetchResponse.json();

		if (response.errors) {
			console.error("Latest posts query returned errors:", response.errors);
			return undefined;
		}

		return response?.data?.posts?.nodes;

	} catch (error: unknown) {
		console.log(error);
		throw new Error("Something went wrong trying to fetch the latest posts");
	}
};
