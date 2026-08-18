/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { IGraphQLResponse } from "@/graphql/CMS/types/graphqlResponse";

const GRAPHQL_ENDPOINT: string | undefined = process.env.NEXT_PUBLIC_CMS_API_URL;
if (!GRAPHQL_ENDPOINT) throw new Error("NEXT_PUBLIC_CMS_API_URL not defined.");

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX COMMENT REACTIONS XXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export type ICommentReactions = {
	likes: number;
	dislikes: number;
};

/**
 * Fetches like/dislike counts for a batch of comments (a post's top-level
 * comments plus their replies) in a single round trip, via
 * `comments(where: { commentIn: [...] })` (confirmed live, read-only) —
 * isolated from `getPostComments`'s query for the same reason
 * `getPostReactions` is isolated from `getPostContentBySlug`: `likes`/
 * `dislikes` are custom fields from the simple-blogs-post-likes mu-plugin,
 * and a GraphQL schema-validation error for an unknown field fails the
 * *entire* request — folding these into the main comments query would take
 * down the whole comments section (a native WP feature) just because the
 * reactions plugin isn't installed yet.
 * @param commentDatabaseIds The `databaseId`s of every comment/reply on the page to fetch reactions for.
 * @returns A promise resolving to a map of `databaseId -> {likes, dislikes}`
 * (comments with no reactions yet simply won't have an entry), or `undefined`
 * if the fetch/query failed — including the expected case where the
 * mu-plugin isn't installed yet. Callers should fall back to `{likes: 0,
 * dislikes: 0}` per comment either way.
 */
export const getCommentReactions = async (commentDatabaseIds: number[]): Promise<Record<number, ICommentReactions> | undefined> => {
	if (commentDatabaseIds.length === 0) return {};

	try {
		const content = `
			query GetCommentReactions($commentDatabaseIds: [ID]) {
				comments(where: { commentIn: $commentDatabaseIds }) {
					nodes {
						databaseId
						likes
						dislikes
					}
				}
			}
		`;

		const nextJSFetchResponse: Response = await fetch(GRAPHQL_ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query: content, variables: { commentDatabaseIds } }),
			next: { revalidate: 60 },
		});

		if (!nextJSFetchResponse.ok) {
			console.error(`Comment reactions fetch failed with status: ${nextJSFetchResponse.status}`);
			return undefined;
		}

		const response: IGraphQLResponse<{
			comments: { nodes: { databaseId: number; likes: number | null; dislikes: number | null }[] } | null;
		}> = await nextJSFetchResponse.json();

		if (response.errors) {
			console.log("Comment reactions query returned errors (mu-plugin may not be installed yet):", response.errors);
			return undefined;
		}

		const nodes = response?.data?.comments?.nodes ?? [];

		return nodes.reduce<Record<number, ICommentReactions>>((reactionsByCommentId, node) => {
			reactionsByCommentId[node.databaseId] = { likes: node.likes ?? 0, dislikes: node.dislikes ?? 0 };
			return reactionsByCommentId;
		}, {});

	} catch (error: unknown) {
		console.log(error);
		return undefined;
	}
};
