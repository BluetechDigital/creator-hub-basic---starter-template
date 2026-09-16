/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { IGraphQLResponse } from "@/graphql/CMS/types/graphqlResponse";
import { buildVideoArticleSlug } from "@/api/WordPress/CreateVideoArticleDraft";

const GRAPHQL_ENDPOINT: string | undefined = process.env.NEXT_PUBLIC_CMS_API_URL;
if (!GRAPHQL_ENDPOINT) throw new Error("NEXT_PUBLIC_CMS_API_URL not defined.");

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Video Article Link XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export type IVideoArticleLink = {
	title: string;
	slug: string;
};

/**
 * Looks up the published article generated for a video, if one exists —
 * `app/[locale]/videos/[slug]/fragments/VideoArticleLink.tsx`'s only data
 * source, letting the video page link to its article
 * (`app/api/videos/generate-articles/route.ts` /
 * `api/WordPress/CreateVideoArticleDraft.ts` create it as a WordPress post,
 * but nothing else connects the two pages without this lookup).
 *
 * Reuses the same deterministic slug (`buildVideoArticleSlug`) the cron uses
 * to create/dedupe the post, so no separate video↔article mapping needs to
 * exist anywhere. Deliberately filters to `status: PUBLISH` — a draft still
 * awaiting the creator's review must not be linked from the live site.
 *
 * Never throws — this is optional, decorative content on the video page; a
 * CMS blip here should cost nothing more than the teaser not appearing, same
 * graceful-degradation shape as `GetPostFilterOptions.ts`.
 * @param videoId The video to look up a generated article for.
 * @returns The article's `{title, slug}`, or `undefined` if none is published yet (or the lookup failed).
 */
export const getVideoArticleLink = async (videoId: string): Promise<IVideoArticleLink | undefined> => {
	try {
		const content = `
			query GetVideoArticleLink($slug: String!) {
				posts(where: {name: $slug, status: PUBLISH}) {
					edges {
						node {
							title
							slug
						}
					}
				}
			}
		`;

		const nextJSFetchResponse: Response = await fetch(GRAPHQL_ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query: content, variables: { slug: buildVideoArticleSlug(videoId) } }),
			next: { revalidate: 86400 },
		});

		if (!nextJSFetchResponse.ok) {
			console.error(`Video article link fetch failed with status: ${nextJSFetchResponse.status}`);
			return undefined;
		}

		const response: IGraphQLResponse<{ posts: { edges: { node: IVideoArticleLink }[] } }> = await nextJSFetchResponse.json();

		if (response.errors) {
			console.error(`Video article link query for video "${videoId}" returned errors:`, response.errors);
			return undefined;
		}

		return response?.data?.posts?.edges?.[0]?.node;

	} catch (error: unknown) {
		console.log(error);
		return undefined;
	}
};
