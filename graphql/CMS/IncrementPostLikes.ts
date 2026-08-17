/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { IGraphQLResponse } from "@/graphql/CMS/types/graphqlResponse";

const GRAPHQL_ENDPOINT: string | undefined = process.env.NEXT_PUBLIC_CMS_API_URL;
if (!GRAPHQL_ENDPOINT) throw new Error("NEXT_PUBLIC_CMS_API_URL not defined.");

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX INCREMENT POST LIKES XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Increments a post's like count by 1, via the custom `incrementPostLikes`
 * mutation registered by the `simple-blogs-post-likes` mu-plugin (see
 * `wordpress-mu-plugins/`). Returns `undefined` — not a thrown error — when that
 * plugin isn't installed yet (the mutation doesn't exist), same graceful-
 * degradation reasoning as `getPostLikes`: this is an expected state for a fresh
 * fork, not a bug to surface as a crash.
 * @param databaseId The post's `databaseId` to like.
 * @returns A promise resolving to the new like count, or `undefined` on failure
 * (including "mutation doesn't exist yet" and the server-side rate limit rejecting
 * a too-frequent request from the same visitor).
 */
export const incrementPostLikes = async (databaseId: number): Promise<number | undefined> => {
	try {
		const mutation = `
			mutation IncrementPostLikes($postId: Int!) {
				incrementPostLikes(input: { postId: $postId }) {
					likes
				}
			}
		`;

		const nextJSFetchResponse: Response = await fetch(GRAPHQL_ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query: mutation, variables: { postId: databaseId } }),
		});

		if (!nextJSFetchResponse.ok) {
			console.error(`Increment post likes mutation failed with status: ${nextJSFetchResponse.status}`);
			return undefined;
		}

		const response: IGraphQLResponse<{ incrementPostLikes: { likes: number } | null }> = await nextJSFetchResponse.json();

		if (response.errors) {
			console.log("Increment post likes mutation returned errors (mu-plugin may not be installed, or rate-limited):", response.errors);
			return undefined;
		}

		return response?.data?.incrementPostLikes?.likes;

	} catch (error: unknown) {
		console.log(error);
		return undefined;
	}
};
