'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, memo, useState } from "react";
import type { IInstagramFeed } from "@/api/Instagram/GetAllInstagramFeedContent";
import InstagramTile, { IInstagramTileLabels } from "@/components/CMS/InstagramFeed/fragments/InstagramTile";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/InstagramFeed/styles/InstagramFeed.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Configuration XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Tiles visible before "Show more" is pressed — one 3-column row of three on
// desktop. The rest of the batch `InstagramFeed` fetched is already in `posts`,
// so revealing more is local state, not another round trip (same approach as
// `AllBlogPosts/fragments/PostsGrid.tsx`).
const INITIAL_VISIBLE_COUNT = 9;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IInstagramGrid = {
	posts: IInstagramFeed;
	/** UI strings, already localised upstream via `getDictionary`. */
	labels: { showMore: string; empty: string } & IInstagramTileLabels;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX InstagramGrid Component XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * The tile grid for `InstagramFeed`. Shows `INITIAL_VISIBLE_COUNT` tiles, then
 * a "Show more" button that reveals the rest of the already-fetched batch — no
 * extra request, mirroring `PostsGrid`. Each tile is an `InstagramTile`
 * (carousel + hover stats). `memo`-wrapped client component; no data fetching.
 */
const InstagramGrid: FC<IInstagramGrid> = memo(({ posts, labels }) => {

	const [showAll, setShowAll] = useState(false);

	if (!posts.length) {
		return <p className={styles.instagramFeedEmpty}>{labels.empty}</p>;
	}

	const visiblePosts = showAll ? posts : posts.slice(0, INITIAL_VISIBLE_COUNT);
	const hasMore = !showAll && posts.length > INITIAL_VISIBLE_COUNT;

	return (
		<>
			<div className={styles.instagramFeedGrid}>
				{visiblePosts.map((post, index) => (
					<InstagramTile key={post?.id ?? index} post={post} labels={labels} />
				))}
			</div>

			{hasMore && (
				<div className={styles.instagramFeedShowMoreWrapper}>
					<button
						type="button"
						className={styles.instagramFeedShowMoreButton}
						onClick={() => setShowAll(true)}
					>
						{labels.showMore}
					</button>
				</div>
			)}
		</>
	);
});

InstagramGrid.displayName = "InstagramGrid";

export default InstagramGrid;
