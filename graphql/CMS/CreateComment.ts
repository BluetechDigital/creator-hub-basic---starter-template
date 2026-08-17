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
	/** The parent comment's global GraphQL `id` (not its `databaseId`) — set only when replying to an existing comment. Omitted/undefined creates a top-level comment. */
	parentId?: string;
};

/**
 * Submits a new comment on a post via WPGraphQL's `createComment` mutation. A
 * successful `{success: true}` here means the submission was accepted — whether
 * it's immediately publicly visible depends on the WordPress site's own
 * Discussion settings (`Settings → Discussion → "Comment must be manually
 * approved"`), which this codebase doesn't control or assume either way.
 * Callers should show a generic confirmation rather than promising instant
 * visibility or claiming the comment is pending review.
 *
 * `parentId` (confirmed live, via a validation-only probe — never executed
 * against real data) maps to `CreateCommentInput.parent`, WPGraphQL's standard
 * threaded-reply field. Passing it makes this a reply instead of a top-level
 * comment.
 * @param postId The post's `databaseId` to comment on.
 * @param authorName The commenter's name.
 * @param authorEmail The commenter's email (not displayed publicly — standard WP behaviour).
 * @param content The comment body.
 * @param parentId The parent comment's global `id`, when replying; omit for a top-level comment.
 * @returns A promise resolving to `{success: boolean}`, or `undefined` if the fetch itself failed.
 */
export const createComment = async ({
	postId,
	authorName,
	authorEmail,
	content,
	parentId,
}: ICreateCommentArgs): Promise<{ success: boolean } | undefined> => {
	try {
		const mutation = `
			mutation CreateComment($postId: Int!, $authorName: String!, $authorEmail: String!, $content: String!, $parentId: ID) {
				createComment(input: {
					commentOn: $postId,
					author: $authorName,
					authorEmail: $authorEmail,
					content: $content,
					parent: $parentId
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
				variables: { postId, authorName, authorEmail, content, parentId },
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
