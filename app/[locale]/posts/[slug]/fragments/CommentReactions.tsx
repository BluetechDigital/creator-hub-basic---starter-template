'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { useEffect, useState } from "react";
import { setCommentReaction } from "@/app/[locale]/posts/[slug]/actions";
import { IReaction } from "@/graphql/CMS/SetPostReaction";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/app/[locale]/posts/[slug]/styles/SinglePost.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type ICommentReactions = {
	commentId: number;
	initialLikes: number;
	initialDislikes: number;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXX CommentReactions Component XXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * A comment-level like/dislike pill — the same mutually-exclusive-reaction
 * pattern as `EngagementBar.tsx`'s post-level pill (swap-in-one-call via
 * `setCommentReaction`, a `comment_reaction_<commentId>` cookie tracking the
 * visitor's current reaction, optimistic count updates from the mutation's
 * response), just sized down for inline use under a comment's body instead of
 * being the page's main engagement row. Rendered for both top-level comments
 * and their replies (`CommentsFeed.tsx`).
 *
 * `initialLikes`/`initialDislikes` come from `getCommentReactions`, which
 * resolves to `undefined` (shown here as 0/0 per comment) if the
 * simple-blogs-post-likes mu-plugin isn't installed yet — the buttons still
 * render in that case, they just won't successfully react until the plugin
 * is installed.
 * @param commentId The comment's `databaseId` to react to.
 * @param initialLikes The comment's current like count.
 * @param initialDislikes The comment's current dislike count.
 */
const CommentReactions = ({ commentId, initialLikes, initialDislikes }: ICommentReactions) => {
	const [likes, setLikes] = useState(initialLikes);
	const [dislikes, setDislikes] = useState(initialDislikes);
	const [reaction, setReactionState] = useState<IReaction | undefined>(undefined);
	const [isReacting, setIsReacting] = useState(false);

	useEffect(() => {
		const match = document.cookie.match(new RegExp(`(?:^|; )comment_reaction_${commentId}=(like|dislike)`));
		const current = match ? (match[1] as IReaction) : undefined;
		queueMicrotask(() => setReactionState(current));
	}, [commentId]);

	const handleReact = async (clicked: IReaction) => {
		if (isReacting) return;

		const newReaction: IReaction | "none" = reaction === clicked ? "none" : clicked;

		setIsReacting(true);

		const result = await setCommentReaction(commentId, reaction, newReaction);

		if (result.success) {
			setLikes(result.likes);
			setDislikes(result.dislikes);
			setReactionState(newReaction === "none" ? undefined : newReaction);

			if (newReaction === "none") {
				document.cookie = `comment_reaction_${commentId}=; max-age=0; path=/`;
			} else {
				document.cookie = `comment_reaction_${commentId}=${newReaction}; max-age=31536000; path=/`;
			}
		}

		setIsReacting(false);
	};

	return (
		<div className={styles.commentReactionPill}>
			<button
				type="button"
				onClick={() => handleReact("like")}
				disabled={isReacting}
				aria-pressed={reaction === "like"}
				aria-label="Like this comment"
				className={`${styles.commentReactionButton} ${reaction === "like" ? styles.commentReactionButtonActive : ''}`}
			>
				<svg width="16" height="16" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M16.9724 20H4.6C4.26863 20 4 19.7314 4 19.4V9.6C4 9.26863 4.26863 9 4.6 9H7.36762C8.07015 9 8.72116 8.6314 9.0826 8.02899L11.793 3.51161C12.3779 2.53688 13.7554 2.44422 14.4655 3.33186C14.8002 3.75025 14.9081 4.30635 14.7541 4.81956L13.7317 8.22759C13.6162 8.61256 13.9045 9 14.3064 9H18.8815C20.2002 9 21.158 10.254 20.811 11.5262L18.9019 18.5262C18.6646 19.3964 17.8743 20 16.9724 20Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
					<path d="M7.5 20L7.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
				<span className={styles.commentReactionCount}>{likes}</span>
			</button>
			<span className={styles.commentReactionDivider} aria-hidden="true" />
			<button
				type="button"
				onClick={() => handleReact("dislike")}
				disabled={isReacting}
				aria-pressed={reaction === "dislike"}
				aria-label="Dislike this comment"
				className={`${styles.commentReactionButton} ${reaction === "dislike" ? styles.commentReactionButtonActive : ''}`}
			>
				<svg className={styles.commentReactionIconFlipped} width="16" height="16" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M16.9724 20H4.6C4.26863 20 4 19.7314 4 19.4V9.6C4 9.26863 4.26863 9 4.6 9H7.36762C8.07015 9 8.72116 8.6314 9.0826 8.02899L11.793 3.51161C12.3779 2.53688 13.7554 2.44422 14.4655 3.33186C14.8002 3.75025 14.9081 4.30635 14.7541 4.81956L13.7317 8.22759C13.6162 8.61256 13.9045 9 14.3064 9H18.8815C20.2002 9 21.158 10.254 20.811 11.5262L18.9019 18.5262C18.6646 19.3964 17.8743 20 16.9724 20Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
					<path d="M7.5 20L7.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
				<span className={styles.commentReactionCount}>{dislikes}</span>
			</button>
		</div>
	);
};

CommentReactions.displayName = 'CommentReactions';

export default CommentReactions;
