'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { useState } from "react";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/app/[locale]/videos/[slug]/styles/SingleVideo.module.css";
// .showMoreButton — the exact same pill button PostsGrid.tsx uses for its
// "Show more" control, reused directly rather than recreated. Its wrapper's
// divider is NOT reused here — see .showMoreWrapper's own comment in
// SingleVideo.module.css for why this needed its own, divider-less wrapper.
import blogStyles from "@/components/CMS/AllBlogPosts/styles/AllBlogPosts.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Configuration XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// A YouTube description can run to several paragraphs (timestamps, links,
// sponsor blurbs) — truncated to this many words up front, same "reveal the
// rest on demand, no extra fetch" idea as PostsGrid's INITIAL_VISIBLE_COUNT.
const INITIAL_WORD_COUNT = 100;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IVideoDescription = {
	description: string;
	/** Only `common.showMore`/`.showLess` are read — passed down from `VideoHero.tsx`'s own `dict.common` slice. */
	dict: { showMore: string; showLess: string };
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXX VideoDescription Component XXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders the video's own YouTube description, truncated to
 * `INITIAL_WORD_COUNT` words behind a "Show more"/"Show less" toggle when it
 * runs longer than that — the full text is already on the page (no second
 * fetch), this is local state only, same idea as `PostsGrid.tsx`'s `showAll`
 * toggle, except reversible here rather than a one-way reveal (a video
 * description can be long enough that collapsing it back down matters).
 * `'use client'` for that state; `VideoHero.tsx` (an async Server Component)
 * renders this as a child rather than holding the toggle itself.
 * @param description The video's `snippet.description` — plain text with embedded `\n` line breaks, not HTML.
 * @param dict `{showMore, showLess}` — this route's `common` dictionary slice.
 */
const VideoDescription = ({ description, dict }: IVideoDescription) => {
	const [showAll, setShowAll] = useState(false);

	const words = description.split(/\s+/);
	const isTruncated = words.length > INITIAL_WORD_COUNT;
	const visibleText = !isTruncated || showAll ? description : `${words.slice(0, INITIAL_WORD_COUNT).join(" ")}…`;

	return (
		<div className={styles.videoDescriptionWrapper}>
			<p className={styles.videoDescription}>{visibleText}</p>
			{isTruncated && (
				<div className={styles.showMoreWrapper}>
					<button type="button" className={blogStyles.showMoreButton} onClick={() => setShowAll((current) => !current)}>
						{showAll ? dict.showLess : dict.showMore}
					</button>
				</div>
			)}
		</div>
	);
};

VideoDescription.displayName = 'VideoDescription';

export default VideoDescription;
