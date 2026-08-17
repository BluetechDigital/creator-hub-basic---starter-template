/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { IGraphQLResponse } from "@/graphql/CMS/types/graphqlResponse";
import { IReaction } from "@/graphql/CMS/SetPostReaction";
import { ICommentReactions } from "@/graphql/CMS/GetCommentReactions";

const GRAPHQL_ENDPOINT: string | undefined = process.env.NEXT_PUBLIC_CMS_API_URL;
if (!GRAPHQL_ENDPOINT) throw new Error("NEXT_PUBLIC_CMS_API_URL not defined.");

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX SET COMMENT REACTION XXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Calls the `setCommentReaction` mutation added by the `simple-blogs-post-likes`
 * mu-plugin (see `wordpress-mu-plugins/`) to atomically swap a visitor's
 * reaction on a comment — same shape as `setPostReaction`, just targeting a
 * comment's `databaseId` instead of a post's.
 * @param commentId The comment's `databaseId` (its numeric WP comment ID).
 * @param previousReaction The visitor's reaction before this change, or
 * `undefined` if they had no prior reaction.
 * @param newReaction The visitor's new reaction, or `"none"` to just clear
 * their previous reaction without setting a new one.
 * @returns A promise resolving to the updated `{likes, dislikes}`, or
 * `undefined` if the mutation failed — including the expected case where the
 * mu-plugin isn't installed yet.
 */
export const setCommentReaction = async (
	commentId: number,
	previousReaction: IReaction | undefined,
	newReaction: IReaction | "none"
): Promise<ICommentReactions | undefined> => {
	try {
		const content = `
			mutation SetCommentReaction($commentId: Int!, $previousReaction: String, $newReaction: String) {
				setCommentReaction(input: { commentId: $commentId, previousReaction: $previousReaction, newReaction: $newReaction }) {
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
				variables: { commentId, previousReaction: previousReaction ?? null, newReaction },
			}),
		});

		if (!nextJSFetchResponse.ok) {
			console.error(`Set comment reaction mutation failed with status: ${nextJSFetchResponse.status}`);
			return undefined;
		}

		const response: IGraphQLResponse<{ setCommentReaction: ICommentReactions | null }> = await nextJSFetchResponse.json();

		if (response.errors) {
			console.log("Set comment reaction mutation returned errors (mu-plugin may not be installed yet):", response.errors);
			return undefined;
		}

		if (!response?.data?.setCommentReaction) return undefined;

		return response.data.setCommentReaction;

	} catch (error: unknown) {
		console.log(error);
		return undefined;
	}
};
