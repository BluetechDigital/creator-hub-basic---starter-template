/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX COMMENTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * A single approved comment on a post, as returned by `getPostComments`.
 * `replies` is fetched one level deep only — a reply's own replies aren't
 * requested, since the comment UI flattens reply-to-reply into the same
 * top-level thread (YouTube-style) rather than nesting indefinitely.
 */
export type IProps = {
	id: string;
	content: string;
	date: string;
	author?: {
		node: {
			name: string;
			avatar?: { url: string } | null;
		};
	} | null;
	replies?: {
		nodes: IProps[];
	} | null;
};

/* ---- createComment mutation ---- */

export type ICreateCommentResponse = {
	createComment: {
		success: boolean;
	} | null;
};
