/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { IGraphQLResponse } from "@/graphql/CMS/types/graphqlResponse";
import * as IComment from "@/graphql/CMS/types/comment";

const GRAPHQL_ENDPOINT: string | undefined = process.env.NEXT_PUBLIC_CMS_API_URL;
if (!GRAPHQL_ENDPOINT) throw new Error("NEXT_PUBLIC_CMS_API_URL not defined.");

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX POST COMMENTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export type IPostComments = {
	commentCount: number;
	comments: IComment.IProps[];
};

/**
 * Fetches a single post's approved comment count + top-level comments (each
 * with up to 20 direct replies nested one level deep — see `IComment.IProps`'s
 * doc comment for why replies aren't fetched recursively) — kept as its own
 * isolated query with a short 60s cache, rather than folded into
 * `getPostContentBySlug`'s query (which caches for 24h — fine for content that
 * rarely changes, but far too long for a comment a visitor just posted and had
 * approved to actually show up on the page). Confirmed live: a comment
 * approved in wp-admin was correctly returned by WPGraphQL immediately, but
 * didn't appear on the frontend until the 24h post-content cache expired —
 * this isolation, matching `getPostReactions`'s 60s cache, fixes that.
 *
 * `where: { parent: 0 }` (confirmed live) filters `comments` to top-level only
 * — without it, replies would also come back as their own flat entries,
 * duplicating them alongside their nested appearance under `replies`.
 * `commentCount` is unaffected by that filter — it's WordPress's own total
 * comment count for the post, replies included, matching what a visitor
 * actually sees added up across top-level comments and their replies.
 * @param databaseId The post's `databaseId` (its numeric WP post ID).
 * @returns A promise resolving to `{commentCount, comments}`, or `undefined` if the fetch/query failed.
 */
export const getPostComments = async (databaseId: number): Promise<IPostComments | undefined> => {
	try {
		const content = `
			{
				post(id: ${databaseId}, idType: DATABASE_ID) {
					commentCount
					comments(first: 20, where: { parent: 0 }) {
						nodes {
							id
							content
							date
							author {
								node {
									name
									avatar {
										url
									}
								}
							}
							replies(first: 20) {
								nodes {
									id
									content
									date
									author {
										node {
											name
											avatar {
												url
											}
										}
									}
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
			next: { revalidate: 60 },
		});

		if (!nextJSFetchResponse.ok) {
			console.error(`Post comments fetch failed with status: ${nextJSFetchResponse.status}`);
			return undefined;
		}

		const response: IGraphQLResponse<{
			post: { commentCount: number | null; comments: { nodes: IComment.IProps[] } | null } | null;
		}> = await nextJSFetchResponse.json();

		if (response.errors) {
			console.error("Post comments query returned errors:", response.errors);
			return undefined;
		}

		if (!response?.data?.post) return undefined;

		return {
			commentCount: response.data.post.commentCount ?? 0,
			comments: response.data.post.comments?.nodes ?? [],
		};

	} catch (error: unknown) {
		console.log(error);
		return undefined;
	}
};
