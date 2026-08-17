'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { ReactNode, useState } from "react";
import Image from "next/image";
import DOMPurify from "isomorphic-dompurify";
import * as IComment from "@/graphql/CMS/types/comment";
import { formatRelativeDate } from "@/app/posts/[slug]/fragments/formatRelativeDate";
import CommentForm from "@/app/posts/[slug]/fragments/CommentForm";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/app/posts/[slug]/styles/SinglePost.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type ICommentsFeed = {
	postId: number;
	comments: IComment.IProps[];
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX CommentEntry Component XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Avatar + author/date meta + sanitized body, shared by both top-level
 * comments and their replies. `children` (the Reply toggle/inline reply box/
 * nested replies list, for top-level comments only) renders inside the same
 * `.commentBody` column, below the content — not as a sibling of it — so it
 * stacks vertically under the comment text instead of appearing as a third
 * flex item next to the avatar.
 */
const CommentEntry = ({ comment, children }: { comment: IComment.IProps; children?: ReactNode }) => (
	<>
		{comment.author?.node?.avatar?.url && (
			<Image
				src={comment.author.node.avatar.url}
				alt={comment.author.node.name}
				width={40}
				height={40}
				className={styles.commentAvatar}
			/>
		)}
		<div className={styles.commentBody}>
			<div className={styles.commentMeta}>
				<span className={styles.commentAuthor}>{comment.author?.node?.name ?? 'Anonymous'}</span>
				<span className={styles.commentDate}>{formatRelativeDate(comment.date)}</span>
			</div>
			<div
				className={styles.commentContent}
				dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.content) }}
			/>
			{children}
		</div>
	</>
);

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX CommentsFeed Component XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders the list of a post's approved, top-level comments (`post.comments`
 * — pending/unapproved comments never appear here, WPGraphQL's public
 * `comments` query only returns approved ones), each with its replies nested
 * beneath it and a "Reply" toggle that opens an inline `CommentForm` scoped to
 * that comment. Unlike the archive/latest-posts empty states, this shows an
 * explicit "be the first to comment" invite rather than rendering nothing,
 * since an empty comments section benefits from a call to action. Anchored
 * `id="comments"` so `EngagementBar`'s comment-count link can jump straight to
 * it. Heading matches YouTube's comments-section convention — the count comes
 * before the word ("1,479 Comments"), not after it in parentheses.
 *
 * Client Component (not a plain Server Component like it used to be) because
 * tracking which comment's reply box is currently open is local UI state, not
 * data — matching `EngagementBar`/`CommentForm`'s existing 'use client' usage
 * for the same reason.
 *
 * Replies aren't fetched recursively (see `IComment.IProps`'s doc comment), so
 * only top-level comments get a "Reply" toggle — replying to a reply still
 * posts under the same top-level thread (YouTube-style), it's just not
 * offered as a separate action from a reply's own row in this first pass.
 * @param postId The post's `databaseId` — needed so an opened reply box knows which post to comment on.
 * @param comments The post's approved top-level comments, in the order WPGraphQL returns them.
 */
const CommentsFeed = ({ postId, comments }: ICommentsFeed) => {
	const [openReplyId, setOpenReplyId] = useState<string | null>(null);

	return (
		<section id="comments" className={styles.commentsFeed}>
			<h2 className={styles.commentsHeading}>
				{comments.length.toLocaleString()} {comments.length === 1 ? 'Comment' : 'Comments'}
			</h2>
			{comments.length === 0 ? (
				<p className={styles.commentsEmpty}>No comments yet — be the first to share your thoughts.</p>
			) : (
				<ul className={styles.commentsList}>
					{comments.map((comment) => (
						<li key={comment.id} className={styles.commentItem}>
							<CommentEntry comment={comment}>
								<button
									type="button"
									onClick={() => setOpenReplyId(openReplyId === comment.id ? null : comment.id)}
									className={styles.commentReplyToggle}
								>
									Reply
								</button>

								{openReplyId === comment.id && (
									<div className={styles.commentReplyForm}>
										<CommentForm
											postId={postId}
											parentId={comment.id}
											onCancel={() => setOpenReplyId(null)}
										/>
									</div>
								)}

								{comment.replies?.nodes && comment.replies.nodes.length > 0 && (
									<ul className={styles.commentReplies}>
										{comment.replies.nodes.map((reply) => (
											<li key={reply.id} className={styles.commentItem}>
												<CommentEntry comment={reply} />
											</li>
										))}
									</ul>
								)}
							</CommentEntry>
						</li>
					))}
				</ul>
			)}
		</section>
	);
};

CommentsFeed.displayName = 'CommentsFeed';

export default CommentsFeed;
