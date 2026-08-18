/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { IGraphQLResponse } from "@/graphql/CMS/types/graphqlResponse";

const GRAPHQL_ENDPOINT: string | undefined = process.env.NEXT_PUBLIC_CMS_API_URL;
if (!GRAPHQL_ENDPOINT) throw new Error("NEXT_PUBLIC_CMS_API_URL not defined.");

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX POST REACTIONS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export type IPostReactions = {
	likes: number;
	dislikes: number;
};

/**
 * Fetches a single post's like/dislike counts — kept as its own isolated query
 * rather than folded into `getPostContentBySlug`'s query, because `likes`/
 * `dislikes` are custom fields added by the `simple-blogs-post-likes` mu-plugin
 * (see `wordpress-mu-plugins/`), which may not be installed on every fork/
 * environment. Querying a field that doesn't exist in the schema fails the
 * *entire* GraphQL request (not just that field), so this stays separate: if the
 * plugin isn't installed, this function alone fails gracefully and the rest of
 * the post still renders normally. `likes` and `dislikes` are fetched together
 * (not as two separate isolated calls) since they come from the same plugin —
 * either both fields exist or neither does.
 * @param databaseId The post's `databaseId` (its numeric WP post ID).
 * @returns A promise resolving to `{likes, dislikes}`, or `undefined` if the
 * fetch/query failed — including the expected case where the mu-plugin isn't
 * installed yet.
 */
export const getPostReactions = async (databaseId: number): Promise<IPostReactions | undefined> => {
	try {
		const content = `
			query GetPostReactions($databaseId: ID!) {
				post(id: $databaseId, idType: DATABASE_ID) {
					likes
					dislikes
				}
			}
		`;

		const nextJSFetchResponse: Response = await fetch(GRAPHQL_ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query: content, variables: { databaseId } }),
			next: { revalidate: 60 },
		});

		if (!nextJSFetchResponse.ok) {
			console.error(`Post reactions fetch failed with status: ${nextJSFetchResponse.status}`);
			return undefined;
		}

		const response: IGraphQLResponse<{ post: IPostReactions | null }> = await nextJSFetchResponse.json();

		if (response.errors) {
			// Expected/routine when the simple-blogs-post-likes mu-plugin isn't
			// installed yet (the `likes`/`dislikes` fields don't exist) — not
			// logged as an error, since that's a normal, anticipated state for a
			// fresh fork, not a bug.
			console.log("Post reactions query returned errors (mu-plugin may not be installed yet):", response.errors);
			return undefined;
		}

		if (!response?.data?.post) return undefined;

		return { likes: response.data.post.likes ?? 0, dislikes: response.data.post.dislikes ?? 0 };

	} catch (error: unknown) {
		console.log(error);
		return undefined;
	}
};
