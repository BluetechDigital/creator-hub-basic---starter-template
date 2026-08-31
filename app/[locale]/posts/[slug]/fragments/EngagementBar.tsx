'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { useEffect, useState } from "react";
import { setReaction } from "@/app/[locale]/posts/[slug]/actions";
import { IReaction } from "@/graphql/CMS/SetPostReaction";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/app/[locale]/posts/[slug]/styles/SinglePost.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IEngagementBar = {
	postId: number;
	initialLikes: number;
	initialDislikes: number;
	commentCount: number;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXX EngagementBar Component XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Like/dislike pill + comment-count pill, styled after YouTube's video-page
 * engagement row (like and dislike sharing one rounded pill split by a thin
 * divider, comment count as its own separate pill alongside it) rather than
 * the original shuffle.dev "Nightsable" counter row it started from. The
 * comment icon is a plain anchor to `#comments` (`CommentsFeed.tsx`'s
 * anchor), not a click handler.
 *
 * Reactions are mutually exclusive — a visitor can only be in one of three
 * states (liked, disliked, neither) — tracked as a single `reaction_<postId>`
 * cookie (`"like"` | `"dislike"`, absent = neither), matching the mu-plugin's
 * `setPostReaction` mutation shape (see
 * `wordpress-mu-plugins/simple-blogs-post-likes.php`). Clicking the opposite
 * button while already reacted swaps in one call — decrementing the old count
 * and incrementing the new one — rather than requiring two separate clicks.
 * Clicking the currently-active button again clears the reaction back to
 * neither. Both counts are updated optimistically from the mutation's
 * response (not guessed client-side), since a swap changes two counters at
 * once.
 *
 * The dislike icon reuses the like icon's markup, mirrored with a CSS
 * transform, to avoid shipping a second inline SVG for what is visually the
 * same shape upside down.
 *
 * Rendered inside `PostHero.tsx`, directly below the author bio, so a reader
 * can react without scrolling past the whole article body first.
 *
 * `initialLikes`/`initialDislikes` come from `getPostReactions`, which
 * resolves to `undefined` (shown here as 0/0) if the simple-blogs-post-likes
 * mu-plugin isn't installed yet — the buttons still render in that case, they
 * just won't successfully react until the plugin is installed, handled the
 * same as any other failed reaction attempt.
 */
const EngagementBar = ({ postId, initialLikes, initialDislikes, commentCount }: IEngagementBar) => {
	const [likes, setLikes] = useState(initialLikes);
	const [dislikes, setDislikes] = useState(initialDislikes);
	const [reaction, setReactionState] = useState<IReaction | undefined>(undefined);
	const [isReacting, setIsReacting] = useState(false);

	useEffect(() => {
		const match = document.cookie.match(new RegExp(`(?:^|; )reaction_${postId}=(like|dislike)`));
		const current = match ? (match[1] as IReaction) : undefined;
		queueMicrotask(() => setReactionState(current));
	}, [postId]);

	const handleReact = async (clicked: IReaction) => {
		if (isReacting) return;

		const newReaction: IReaction | "none" = reaction === clicked ? "none" : clicked;

		setIsReacting(true);

		const result = await setReaction(postId, reaction, newReaction);

		if (result.success) {
			setLikes(result.likes);
			setDislikes(result.dislikes);
			setReactionState(newReaction === "none" ? undefined : newReaction);

			if (newReaction === "none") {
				document.cookie = `reaction_${postId}=; max-age=0; path=/`;
			} else {
				// One year — a reaction isn't a transient preference the way cookie
				// consent is, no need to re-ask.
				document.cookie = `reaction_${postId}=${newReaction}; max-age=31536000; path=/`;
			}
		}

		setIsReacting(false);
	};

	return (
		<div className={styles.postEngagement}>
			<div className={styles.reactionPill}>
				<button
					type="button"
					onClick={() => handleReact("like")}
					disabled={isReacting}
					aria-pressed={reaction === "like"}
					aria-label="Like this post"
					className={`${styles.reactionButton} ${reaction === "like" ? styles.reactionButtonActive : ''}`}
				>
					<svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M16.9724 20H4.6C4.26863 20 4 19.7314 4 19.4V9.6C4 9.26863 4.26863 9 4.6 9H7.36762C8.07015 9 8.72116 8.6314 9.0826 8.02899L11.793 3.51161C12.3779 2.53688 13.7554 2.44422 14.4655 3.33186C14.8002 3.75025 14.9081 4.30635 14.7541 4.81956L13.7317 8.22759C13.6162 8.61256 13.9045 9 14.3064 9H18.8815C20.2002 9 21.158 10.254 20.811 11.5262L18.9019 18.5262C18.6646 19.3964 17.8743 20 16.9724 20Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
						<path d="M7.5 20L7.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
					<span className={styles.reactionCount}>{likes}</span>
				</button>
				<span className={styles.reactionDivider} aria-hidden="true" />
				<button
					type="button"
					onClick={() => handleReact("dislike")}
					disabled={isReacting}
					aria-pressed={reaction === "dislike"}
					aria-label="Dislike this post"
					className={`${styles.reactionButton} ${reaction === "dislike" ? styles.reactionButtonActive : ''}`}
				>
					<svg className={styles.reactionIconFlipped} width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M16.9724 20H4.6C4.26863 20 4 19.7314 4 19.4V9.6C4 9.26863 4.26863 9 4.6 9H7.36762C8.07015 9 8.72116 8.6314 9.0826 8.02899L11.793 3.51161C12.3779 2.53688 13.7554 2.44422 14.4655 3.33186C14.8002 3.75025 14.9081 4.30635 14.7541 4.81956L13.7317 8.22759C13.6162 8.61256 13.9045 9 14.3064 9H18.8815C20.2002 9 21.158 10.254 20.811 11.5262L18.9019 18.5262C18.6646 19.3964 17.8743 20 16.9724 20Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
						<path d="M7.5 20L7.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
					<span className={styles.reactionCount}>{dislikes}</span>
				</button>
			</div>
			<a href="#comments" aria-label="View comments" className={styles.commentPillButton}>
				<svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M12.5 22C18.0228 22 22.5 17.5228 22.5 12C22.5 6.47715 18.0228 2 12.5 2C6.97715 2 2.5 6.47715 2.5 12C2.5 13.8214 2.98697 15.5291 3.83782 17L3 21.5L7.5 20.6622C8.97087 21.513 10.6786 22 12.5 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
				<span className={styles.reactionCount}>{commentCount}</span>
			</a>
		</div>
	);
};

EngagementBar.displayName = 'EngagementBar';

export default EngagementBar;
