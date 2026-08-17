/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX COMMENTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/** A single approved comment on a post, as returned as part of `getPostContentBySlug`. */
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
};

/* ---- createComment mutation ---- */

export type ICreateCommentResponse = {
	createComment: {
		success: boolean;
	} | null;
};
