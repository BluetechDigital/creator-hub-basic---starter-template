'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, memo, useState } from "react";
import * as IAllBlogPosts from "@/components/CMS/AllBlogPosts/types/allBlogPosts";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import FeaturedPostCard from "@/components/CMS/AllBlogPosts/fragments/FeaturedPostCard";
import PostCard from "@/components/CMS/AllBlogPosts/fragments/PostCard";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/AllBlogPosts/styles/AllBlogPosts.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Configuration XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// How many grid cards (beyond the featured card) are visible before "Show
// more" is pressed — mirrors the reference design's initial 3-card row before
// its second row of 3 unhides, just expressed as one flat count since this
// grid reveals all of them at once rather than row-by-row.
const INITIAL_VISIBLE_COUNT = 6;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX PostsGrid Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders the archive grid for the summaries handed down by `AllBlogPosts`:
 * the most recent post as a full-width `FeaturedPostCard`, the rest as
 * `PostCard`s in a responsive grid, with everything past
 * `INITIAL_VISIBLE_COUNT` hidden behind a "Show more" reveal rather than
 * fetched — all `POSTS_PAGE_SIZE` posts are already in `posts`, so revealing
 * more is just local state, not another round trip.
 *
 * The featured-card split only happens when the most recent post actually has
 * a featured image (`FeaturedPostCard` needs one to overlay text on) — when it
 * doesn't, every post renders as a plain grid card instead of losing the most
 * recent post from the page entirely.
 *
 * `memo`-wrapped client component since it does no data fetching of its own.
 */
const PostsGrid: FC<IAllBlogPosts.IPostsGrid> = memo(({ posts }) => {

    const [showAll, setShowAll] = useState(false);

    if (!posts.length) {
        return <p className={styles.postsGridEmpty}>No posts published yet — check back soon.</p>;
    }

    const featuredPost = posts[0]?.featuredImage?.node?.sourceUrl ? posts[0] : null;
    const gridPosts = featuredPost ? posts.slice(1) : posts;
    const visiblePosts = showAll ? gridPosts : gridPosts.slice(0, INITIAL_VISIBLE_COUNT);
    const hasMore = !showAll && gridPosts.length > INITIAL_VISIBLE_COUNT;

    return (
        <div className={styles.postsGrid}>
            {featuredPost && <FeaturedPostCard post={featuredPost} />}

            {visiblePosts.length > 0 && (
                <div className={styles.postsGridColumns}>
                    {visiblePosts.map((post) => (
                        <PostCard key={post.slug} post={post} />
                    ))}
                </div>
            )}

            {hasMore && (
                <div className={styles.showMoreWrapper}>
                    <button type="button" className={styles.showMoreButton} onClick={() => setShowAll(true)}>
                        Show more
                    </button>
                </div>
            )}
        </div>
    );
});

PostsGrid.displayName = 'PostsGrid';

export default PostsGrid;
