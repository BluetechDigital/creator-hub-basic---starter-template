/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IComment from "@/graphql/CMS/types/comment";
import { IGraphQLResponse } from "@/graphql/CMS/types/graphqlResponse";

const GRAPHQL_ENDPOINT: string | undefined = process.env.NEXT_PUBLIC_CMS_API_URL;
if (!GRAPHQL_ENDPOINT) throw new Error("NEXT_PUBLIC_CMS_API_URL not defined.");

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX CREATE COMMENT XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type ICreateCommentArgs = {
	postId: number;
	authorName: string;
	authorEmail: string;
	content: string;
};

/**
 * Submits a new comment on a post via WPGraphQL's `createComment` mutation.
 * Confirmed live against this app's actual WordPress install that new comments are
 * held in a pending-moderation queue by default, not auto-published — a successful
 * `{success: true}` here means the submission was accepted, not that the comment is
 * publicly visible yet, so callers should show an "awaiting approval" message
 * rather than trying to render the comment immediately.
 * @param postId The post's `databaseId` to comment on.
 * @param authorName The commenter's name.
 * @param authorEmail The commenter's email (not displayed publicly — standard WP behaviour).
 * @param content The comment body.
 * @returns A promise resolving to `{success: boolean}`, or `undefined` if the fetch itself failed.
 */
export const createComment = async ({
	postId,
	authorName,
	authorEmail,
	content,
}: ICreateCommentArgs): Promise<{ success: boolean } | undefined> => {
	try {
		const mutation = `
			mutation CreateComment($postId: Int!, $authorName: String!, $authorEmail: String!, $content: String!) {
				createComment(input: {
					commentOn: $postId,
					author: $authorName,
					authorEmail: $authorEmail,
					content: $content
				}) {
					success
				}
			}
		`;

		const nextJSFetchResponse: Response = await fetch(GRAPHQL_ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				query: mutation,
				variables: { postId, authorName, authorEmail, content },
			}),
		});

		if (!nextJSFetchResponse.ok) {
			console.error(`Create comment mutation failed with status: ${nextJSFetchResponse.status}`);
			return undefined;
		}

		const response: IGraphQLResponse<IComment.ICreateCommentResponse> = await nextJSFetchResponse.json();

		if (response.errors) {
			console.error("Create comment mutation returned errors:", response.errors);
			return undefined;
		}

		return { success: response?.data?.createComment?.success ?? false };

	} catch (error: unknown) {
		console.log(error);
		throw new Error("Something went wrong trying to submit the comment");
	}
};
