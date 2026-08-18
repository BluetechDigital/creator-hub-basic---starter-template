/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IPost from "@/graphql/CMS/types/post";
import { IGraphQLResponse } from "@/graphql/CMS/types/graphqlResponse";
import { POST_SUMMARY_FIELDS } from "@/graphql/CMS/postSummaryFields";

const GRAPHQL_ENDPOINT: string | undefined = process.env.NEXT_PUBLIC_CMS_API_URL;
if (!GRAPHQL_ENDPOINT) throw new Error("NEXT_PUBLIC_CMS_API_URL not defined.");

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX POSTS SUMMARIES XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Fetches a page of published post summaries (title, slug, date, excerpt, featured
 * image, categories, read time) for the blog archive grid and the "Latest news"
 * section, using WPGraphQL's Relay-style cursor pagination on the `posts` connection.
 * `pageInfo` is always returned even though the current `AllBlogPosts` block doesn't
 * render a "Load more" control — keeping the cursor/pageInfo shape wired through now
 * means a future paginated UI only needs to call this again with `after`, not change
 * the query.
 * Field selection is shared with `GetLatestPosts.ts` via `POST_SUMMARY_FIELDS`
 * (`postSummaryFields.ts`) rather than duplicated, so both queries stay in
 * sync with `IPost.ISummaryProps` automatically.
 *
 * `first`/`after` are passed as GraphQL variables rather than interpolated
 * into the query string — `after` isn't wired to any user-facing pagination
 * control yet, but a raw `after: "${after}"` string interpolation would be a
 * GraphQL injection risk the moment it is, so it's built safely from the
 * start rather than left as a bug waiting for that UI to land.
 * @param first Page size.
 * @param after Optional end cursor from a previous page, for future pagination.
 * @returns A promise resolving to `{ posts, pageInfo }`, or `undefined` on failure.
 */
export const getAllPostsSummaries = async (
	first: number = 24,
	after?: string,
): Promise<{ posts: IPost.ISummaryProps[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } | undefined> => {
	try {
		const content = `
			query GetAllPostsSummaries($first: Int!, $after: String) {
				posts(first: $first, after: $after, where: {status: PUBLISH}) {
					nodes {
						${POST_SUMMARY_FIELDS}
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
			body: JSON.stringify({ query: content, variables: { first, after: after ?? null } }),
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
