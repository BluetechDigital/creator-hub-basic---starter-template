'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { useEffect, useState } from "react";
import { incrementLike } from "@/app/posts/[slug]/actions";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/app/posts/[slug]/styles/SinglePost.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IEngagementBar = {
	postId: number;
	initialLikes: number;
	commentCount: number;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXX EngagementBar Component XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Like button + comment-count link, adapted from the shuffle.dev "Nightsable"
 * counter row (React state instead of the source template's Alpine.js
 * `x-on:click`/`x-text`). The comment icon is a plain anchor to `#comments`
 * (`CommentsFeed.tsx`'s anchor), not a click handler.
 *
 * The like button calls the `incrementLike` Server Action, optimistically bumps
 * the displayed count on success, and sets a `liked_<postId>` cookie — same raw
 * `document.cookie` read-on-mount/write-on-action pattern already established by
 * `CookiePolicyContextProvider.tsx` (no cookie library). If that cookie already
 * exists on mount, the button renders disabled — this is a UX guard, not real
 * abuse prevention; the actual backstop is the mu-plugin's own server-side
 * per-post/per-IP rate limit (see `wordpress-mu-plugins/creator-hub-likes.php`),
 * since a client-side-only guard is trivially bypassed by clearing cookies.
 *
 * `initialLikes` comes from `getPostLikes`, which resolves to `undefined` (shown
 * here as 0) if the creator-hub-likes mu-plugin isn't installed yet — the button
 * still renders in that case, it just won't successfully increment until the
 * plugin is installed, handled the same as any other failed like attempt.
 */
const EngagementBar = ({ postId, initialLikes, commentCount }: IEngagementBar) => {
	const [likes, setLikes] = useState(initialLikes);
	const [alreadyLiked, setAlreadyLiked] = useState(false);
	const [isLiking, setIsLiking] = useState(false);

	useEffect(() => {
		const liked = document.cookie.includes(`liked_${postId}=1`);
		queueMicrotask(() => setAlreadyLiked(liked));
	}, [postId]);

	const handleLike = async () => {
		if (alreadyLiked || isLiking) return;

		setIsLiking(true);

		const result = await incrementLike(postId);

		if (result.success) {
			setLikes(result.likes);
			// One year — a "like" isn't a transient preference the way cookie
			// consent is, no need to re-ask.
			document.cookie = `liked_${postId}=1; max-age=31536000; path=/`;
			setAlreadyLiked(true);
		}

		setIsLiking(false);
	};

	return (
		<div className={styles.engagementBar}>
			<button
				type="button"
				onClick={handleLike}
				disabled={alreadyLiked || isLiking}
				aria-pressed={alreadyLiked}
				className={styles.engagementButton}
			>
				<span className={styles.engagementIcon}>
					<svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M16.9724 20H4.6C4.26863 20 4 19.7314 4 19.4V9.6C4 9.26863 4.26863 9 4.6 9H7.36762C8.07015 9 8.72116 8.6314 9.0826 8.02899L11.793 3.51161C12.3779 2.53688 13.7554 2.44422 14.4655 3.33186C14.8002 3.75025 14.9081 4.30635 14.7541 4.81956L13.7317 8.22759C13.6162 8.61256 13.9045 9 14.3064 9H18.8815C20.2002 9 21.158 10.254 20.811 11.5262L18.9019 18.5262C18.6646 19.3964 17.8743 20 16.9724 20Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
						<path d="M7.5 20L7.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				</span>
				<span className={styles.engagementCount}>{likes}</span>
			</button>
			<a href="#comments" className={styles.engagementButton}>
				<span className={styles.engagementIcon}>
					<svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M12.5 22C18.0228 22 22.5 17.5228 22.5 12C22.5 6.47715 18.0228 2 12.5 2C6.97715 2 2.5 6.47715 2.5 12C2.5 13.8214 2.98697 15.5291 3.83782 17L3 21.5L7.5 20.6622C8.97087 21.513 10.6786 22 12.5 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				</span>
				<span className={styles.engagementCount}>{commentCount}</span>
			</a>
		</div>
	);
};

EngagementBar.displayName = 'EngagementBar';

export default EngagementBar;
