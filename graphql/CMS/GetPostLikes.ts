/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { IGraphQLResponse } from "@/graphql/CMS/types/graphqlResponse";

const GRAPHQL_ENDPOINT: string | undefined = process.env.NEXT_PUBLIC_CMS_API_URL;
if (!GRAPHQL_ENDPOINT) throw new Error("NEXT_PUBLIC_CMS_API_URL not defined.");

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX POST LIKES XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Fetches a single post's like count — kept as its own isolated query rather than
 * folded into `getPostContentBySlug`'s query, because `likes` is a custom field
 * added by the `simple-blogs-post-likes` mu-plugin (see `wordpress-mu-plugins/`), which
 * may not be installed on every fork/environment. Querying a field that doesn't
 * exist in the schema fails the *entire* GraphQL request (not just that field), so
 * this stays separate: if the plugin isn't installed, this function alone fails
 * gracefully and the rest of the post still renders normally.
 * @param databaseId The post's `databaseId` (its numeric WP post ID).
 * @returns A promise resolving to the like count, or `undefined` if the fetch/query
 * failed — including the expected case where the mu-plugin isn't installed yet.
 */
export const getPostLikes = async (databaseId: number): Promise<number | undefined> => {
	try {
		const content = `
			{
				post(id: ${databaseId}, idType: DATABASE_ID) {
					likes
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
			console.error(`Post likes fetch failed with status: ${nextJSFetchResponse.status}`);
			return undefined;
		}

		const response: IGraphQLResponse<{ post: { likes: number } | null }> = await nextJSFetchResponse.json();

		if (response.errors) {
			// Expected/routine when the simple-blogs-post-likes mu-plugin isn't installed
			// yet (the `likes` field doesn't exist) — not logged as an error, since
			// that's a normal, anticipated state for a fresh fork, not a bug.
			console.log("Post likes query returned errors (mu-plugin may not be installed yet):", response.errors);
			return undefined;
		}

		return response?.data?.post?.likes;

	} catch (error: unknown) {
		console.log(error);
		return undefined;
	}
};
