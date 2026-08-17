/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { IGraphQLResponse } from "@/graphql/CMS/types/graphqlResponse";
import { IPostReactions } from "@/graphql/CMS/GetPostReactions";

const GRAPHQL_ENDPOINT: string | undefined = process.env.NEXT_PUBLIC_CMS_API_URL;
if (!GRAPHQL_ENDPOINT) throw new Error("NEXT_PUBLIC_CMS_API_URL not defined.");

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX SET POST REACTION XXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export type IReaction = "like" | "dislike";

/**
 * Calls the `setPostReaction` mutation added by the `simple-blogs-post-likes`
 * mu-plugin (see `wordpress-mu-plugins/`) to atomically swap a visitor's
 * reaction on a post. Reactions are mutually exclusive, so the caller passes
 * both the visitor's previous reaction (to decrement) and their new one (to
 * increment) in a single round trip rather than issuing two separate
 * increment/decrement requests.
 * @param postId The post's `databaseId` (its numeric WP post ID).
 * @param previousReaction The visitor's reaction before this change, or
 * `undefined` if they had no prior reaction.
 * @param newReaction The visitor's new reaction, or `"none"` to just clear
 * their previous reaction without setting a new one.
 * @returns A promise resolving to the updated `{likes, dislikes}`, or
 * `undefined` if the mutation failed — including the expected case where the
 * mu-plugin isn't installed yet.
 */
export const setPostReaction = async (
	postId: number,
	previousReaction: IReaction | undefined,
	newReaction: IReaction | "none"
): Promise<IPostReactions | undefined> => {
	try {
		const content = `
			mutation SetPostReaction($postId: Int!, $previousReaction: String, $newReaction: String) {
				setPostReaction(input: { postId: $postId, previousReaction: $previousReaction, newReaction: $newReaction }) {
					likes
					dislikes
				}
			}
		`;

		const nextJSFetchResponse: Response = await fetch(GRAPHQL_ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				query: content,
				variables: { postId, previousReaction: previousReaction ?? null, newReaction },
			}),
		});

		if (!nextJSFetchResponse.ok) {
			console.error(`Set post reaction mutation failed with status: ${nextJSFetchResponse.status}`);
			return undefined;
		}

		const response: IGraphQLResponse<{ setPostReaction: IPostReactions | null }> = await nextJSFetchResponse.json();

		if (response.errors) {
			console.log("Set post reaction mutation returned errors (mu-plugin may not be installed yet):", response.errors);
			return undefined;
		}

		if (!response?.data?.setPostReaction) return undefined;

		return response.data.setPostReaction;

	} catch (error: unknown) {
		console.log(error);
		return undefined;
	}
};
