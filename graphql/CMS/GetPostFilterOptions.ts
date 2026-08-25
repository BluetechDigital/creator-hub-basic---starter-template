/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { unstable_cache } from "next/cache";
import { IGraphQLResponse } from "@/graphql/CMS/types/graphqlResponse";

const GRAPHQL_ENDPOINT: string | undefined = process.env.NEXT_PUBLIC_CMS_API_URL;
if (!GRAPHQL_ENDPOINT) throw new Error("NEXT_PUBLIC_CMS_API_URL not defined.");

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX FILTER OPTIONS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export type ITaxonomyTerm = {
	name: string;
	slug: string;
};

export type IPostFilterOptions = {
	categories: ITaxonomyTerm[];
	tags: ITaxonomyTerm[];
};

/**
 * Fetches every category and tag in use, to populate the archive grid's `PostFilters`
 * bar — kept as its own isolated query rather than folded into `getAllPostsSummaries`,
 * since it describes the *taxonomy* (every term that exists), not any particular page
 * of posts. Isolating it also means a failure here (CMS blip) only costs the filter
 * bar's options, not the posts grid itself — same graceful-degradation shape as
 * `GetPostReactions.ts`: never throws, resolves to `undefined` on any failure.
 *
 * `tags(first: 100)` is a generous cap for a filter dropdown/chip list — nowhere near
 * WPGraphQL's per-request limits, and this is a starter template, not a site with
 * hundreds of distinct tags yet.
 * @returns A promise resolving to `{categories, tags}`, or `undefined` on failure.
 */
const fetchPostFilterOptions = async (): Promise<IPostFilterOptions | undefined> => {
	try {
		const content = `
			query GetPostFilterOptions {
				categories {
					nodes {
						name
						slug
					}
				}
				tags(first: 100) {
					nodes {
						name
						slug
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
			console.error(`Post filter options fetch failed with status: ${nextJSFetchResponse.status}`);
			return undefined;
		}

		const response: IGraphQLResponse<{
			categories: { nodes: ITaxonomyTerm[] } | null;
			tags: { nodes: ITaxonomyTerm[] } | null;
		}> = await nextJSFetchResponse.json();

		if (response.errors) {
			console.error("Post filter options query returned errors:", response.errors);
			return undefined;
		}

		return {
			categories: response?.data?.categories?.nodes ?? [],
			tags: response?.data?.tags?.nodes ?? [],
		};

	} catch (error: unknown) {
		console.log(error);
		return undefined;
	}
};

/**
 * `AllBlogPosts` reads `searchParams` via `app/posts/page.tsx`, which makes
 * the whole `/posts` route dynamic — so every tag/category/date filter click
 * re-renders `AllBlogPosts` as a brand new request, even though this
 * function's result never depends on which filters are active. Wrapping it
 * in `unstable_cache` (keyed on nothing but its own name, since it takes no
 * arguments and its result is identical for every caller) memoizes it across
 * those requests for `revalidate` seconds, so a filter click only re-runs the
 * (genuinely filter-dependent) posts query, not this taxonomy fetch too.
 *
 * `unstable_cache` is soft-deprecated in favor of the `'use cache'` directive
 * as of Next.js 16, but that directive requires opting into Cache Components
 * (`next.config.ts`'s `cacheComponents` flag), which this project doesn't
 * enable — adopting it project-wide is a bigger change than this one
 * function's caching warrants, so `unstable_cache` (still fully functional,
 * just not the newest API) is the deliberately scoped choice here.
 */
export const getPostFilterOptions = unstable_cache(
	fetchPostFilterOptions,
	['post-filter-options'],
	{ revalidate: 86400 },
);
