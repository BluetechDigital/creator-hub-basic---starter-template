/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC } from "react";
import Image from "next/image";
import dateFormat from "dateformat";
import DOMPurify from "isomorphic-dompurify";
import * as IComment from "@/graphql/CMS/types/comment";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/app/posts/[slug]/styles/SinglePost.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type ICommentsFeed = {
	comments: IComment.IProps[];
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX CommentsFeed Component XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders the list of a post's approved comments (`post.comments` — pending/
 * unapproved comments never appear here, WPGraphQL's public `comments` query only
 * returns approved ones). Unlike the archive/latest-posts empty states, this shows
 * an explicit "be the first to comment" invite rather than rendering nothing, since
 * an empty comments section benefits from a call to action. Anchored `id="comments"`
 * so `EngagementBar`'s comment-count link can jump straight to it.
 * @param comments The post's approved comments, in the order WPGraphQL returns them.
 */
const CommentsFeed: FC<ICommentsFeed> = ({ comments }) => {

	return (
		<section id="comments" className={styles.commentsFeed}>
			<h2 className={styles.commentsHeading}>
				{comments.length > 0 ? `Comments (${comments.length})` : 'Comments'}
			</h2>
			{comments.length === 0 ? (
				<p className={styles.commentsEmpty}>No comments yet — be the first to share your thoughts.</p>
			) : (
				<ul className={styles.commentsList}>
					{comments.map((comment) => (
						<li key={comment.id} className={styles.commentItem}>
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
									<span className={styles.commentDate}>{dateFormat(comment.date, "mmmm dS, yyyy")}</span>
								</div>
								<div
									className={styles.commentContent}
									dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.content) }}
								/>
							</div>
						</li>
					))}
				</ul>
			)}
		</section>
	);
};

CommentsFeed.displayName = 'CommentsFeed';

export default CommentsFeed;
