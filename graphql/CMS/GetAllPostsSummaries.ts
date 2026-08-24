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

type IWpDateQueryBoundary = { year: number; month: number; day: number };

/**
 * Splits a plain `"YYYY-MM-DD"` filter string into the `{year, month, day}` shape
 * WPGraphQL's `dateQuery` where-arg expects for its `after`/`before` boundaries — a
 * bare ISO string isn't accepted there (confirmed against the live CMS while building
 * this), only the decomposed object is.
 * @param date A `"YYYY-MM-DD"` string, or `undefined` if that boundary isn't set.
 * @returns The decomposed boundary, or `undefined` to leave that side of the range open.
 */
const buildDateQueryBoundary = (date?: string): IWpDateQueryBoundary | undefined => {
	if (!date) return undefined;

	const [year, month, day] = date.split('-').map(Number);
	return { year, month, day };
};

/**
 * Builds the `dateQuery` where-arg value from a filter's `dateFrom`/`dateTo` strings —
 * `undefined` when neither is set, so it drops out of the GraphQL variables entirely
 * (`JSON.stringify` omits `undefined` object values) rather than sending an empty
 * `dateQuery: {}`.
 * @param dateFrom Inclusive lower bound, `"YYYY-MM-DD"`.
 * @param dateTo Inclusive upper bound, `"YYYY-MM-DD"`.
 */
const buildDateQueryInput = (dateFrom?: string, dateTo?: string) => {
	if (!dateFrom && !dateTo) return undefined;

	return {
		after: buildDateQueryBoundary(dateFrom),
		before: buildDateQueryBoundary(dateTo),
		inclusive: true,
	};
};

/**
 * Fetches a page of published post summaries (title, slug, date, excerpt, featured
 * image, categories, tags, read time) for the blog archive grid and the "Latest news"
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
 *
 * `filters` maps onto three separate WPGraphQL where-args — `tagSlugIn`,
 * `categoryName`, `dateQuery` — all confirmed working directly against this
 * project's live CMS while building the archive's filter bar (see
 * `IPost.IPostFilters`'s doc comment for why category filtering is single-select).
 * An unset filter field is simply `undefined` in the variables object, which
 * `JSON.stringify` drops — no conditional `where`-object assembly needed.
 * @param first Page size.
 * @param after Optional end cursor from a previous page, for future pagination.
 * @param filters Optional tag/category/date-range filters for the archive grid.
 * @returns A promise resolving to `{ posts, pageInfo }`, or `undefined` on failure.
 */
export const getAllPostsSummaries = async (
	first: number = 24,
	after?: string,
	filters?: IPost.IPostFilters,
): Promise<{ posts: IPost.ISummaryProps[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } | undefined> => {
	try {
		const content = `
			query GetAllPostsSummaries($first: Int!, $after: String, $tagSlugIn: [String], $categoryName: String, $dateQuery: DateQueryInput) {
				posts(first: $first, after: $after, where: {status: PUBLISH, tagSlugIn: $tagSlugIn, categoryName: $categoryName, dateQuery: $dateQuery}) {
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

		const variables = {
			first,
			after: after ?? null,
			tagSlugIn: filters?.tagSlugs,
			categoryName: filters?.categorySlug,
			dateQuery: buildDateQueryInput(filters?.dateFrom, filters?.dateTo),
		};

		const nextJSFetchResponse: Response = await fetch(GRAPHQL_ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query: content, variables }),
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
