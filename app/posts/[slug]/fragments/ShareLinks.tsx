'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, useState } from "react";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/app/posts/[slug]/styles/SinglePost.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IShareLinks = {
	url: string;
	title: string;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX ShareLinks Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Facebook share, X/Twitter share, and copy-link buttons for a single post — the
 * Shuffle design's third (Instagram-styled) icon is dropped since Instagram has no
 * share-via-link mechanism to point it at. `'use client'` for the copy-to-clipboard
 * button's click state.
 * @param url The post's absolute URL.
 * @param title The post's title, used as the share text for Facebook/X.
 */
const ShareLinks: FC<IShareLinks> = ({ url, title }) => {
	const [copied, setCopied] = useState(false);

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.log(error);
		}
	};

	const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
	const xShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;

	return (
		<div className={styles.shareLinks}>
			<button type="button" onClick={handleCopyLink} className={styles.copyLinkButton}>
				{copied ? 'Copied!' : 'Copy Link'}
			</button>
			<div className={styles.shareIcons}>
				<a
					href={facebookShareUrl}
					target="_blank"
					rel="noopener noreferrer"
					aria-label="Share on Facebook"
					className={styles.shareIconLink}
				>
					<svg width="10" height="18" viewBox="0 0 10 18" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M7.59948 3.43344H9.16615V0.78344C8.4076 0.704562 7.64544 0.665619 6.88281 0.666773C4.61615 0.666773 3.06615 2.05011 3.06615 4.58344V6.76677H0.507812V9.73344H3.06615V17.3334H6.13281V9.73344H8.68281L9.06614 6.76677H6.13281V4.87511C6.13281 4.00011 6.36615 3.43344 7.59948 3.43344Z" fill="currentColor" />
					</svg>
				</a>
				<a
					href={xShareUrl}
					target="_blank"
					rel="noopener noreferrer"
					aria-label="Share on X"
					className={styles.shareIconLink}
				>
					<svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M17.3346 1.83326C16.7083 2.10501 16.0458 2.28465 15.368 2.3666C16.0831 1.93936 16.619 1.26725 16.8763 0.474931C16.2043 0.874983 15.4686 1.15684 14.7013 1.30826C14.1884 0.752074 13.5054 0.381844 12.7595 0.25564C12.0135 0.129436 11.2468 0.254396 10.5795 0.610922C9.91217 0.967448 9.38208 1.53537 9.07234 2.22563C8.76259 2.91588 8.69071 3.68942 8.86797 4.42493C7.50916 4.3562 6.18 4.00239 4.96685 3.38648C3.75369 2.77057 2.68367 1.90634 1.8263 0.84993C1.52558 1.37507 1.36757 1.96978 1.36797 2.57493C1.3669 3.13692 1.50482 3.69044 1.76943 4.18623C2.03405 4.68202 2.41715 5.10469 2.88464 5.4166C2.34128 5.40181 1.80954 5.25601 1.33464 4.9916V5.03326C1.33871 5.82067 1.61463 6.58251 2.11573 7.1899C2.61683 7.7973 3.31235 8.21297 4.08464 8.3666C3.78735 8.45707 3.4787 8.50477 3.16797 8.50826C2.95288 8.50575 2.73832 8.48625 2.5263 8.44993C2.74623 9.12727 3.17182 9.71922 3.74386 10.1434C4.31591 10.5676 5.00595 10.8029 5.71797 10.8166C4.51564 11.7627 3.03121 12.279 1.5013 12.2833C1.22275 12.2842 0.944415 12.2675 0.667969 12.2333C2.22999 13.2418 4.05031 13.7772 5.90964 13.7749C7.19271 13.7883 8.46558 13.5458 9.6539 13.0617C10.8422 12.5775 11.9222 11.8615 12.8306 10.9553C13.7391 10.0492 14.4579 8.97109 14.9451 7.78402C15.4323 6.59695 15.678 5.3247 15.668 4.0416C15.668 3.89993 15.668 3.74993 15.668 3.59993C16.3219 3.11227 16.8859 2.51445 17.3346 1.83326Z" fill="currentColor" />
					</svg>
				</a>
			</div>
		</div>
	);
};

ShareLinks.displayName = 'ShareLinks';

export default ShareLinks;
