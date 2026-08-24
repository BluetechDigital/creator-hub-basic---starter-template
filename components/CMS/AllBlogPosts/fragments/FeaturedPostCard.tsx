'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import dateFormat from "dateformat";
import * as IAllBlogPosts from "@/components/CMS/AllBlogPosts/types/allBlogPosts";
import { parseWpDate } from "@/graphql/CMS/parseWpDate";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/AllBlogPosts/styles/AllBlogPosts.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXX FeaturedPostCard Component XXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders the archive grid's featured "hero" card — the most recent post shown
 * full-width with its featured image as a backdrop and the date/title overlaid
 * at the bottom on a dark gradient. Layout follows the reference design's
 * featured-post treatment; kept to this site's light theme rather than that
 * design's dark page background, since only this one card needs to be dark
 * (for the overlaid white text to stay legible on a photo) not the whole page.
 *
 * Renders nothing if the post has no featured image — `PostsGrid` checks this
 * same condition before deciding whether to treat a post as the featured card
 * at all, so this is really just a defensive second check, not the primary
 * gate.
 * @param post The post to feature — normally the single most recent post.
 */
const FeaturedPostCard: FC<IAllBlogPosts.IPostCard> = memo(({ post }) => {

	if (!post.featuredImage?.node?.sourceUrl) return null;

	return (
		<Link href={`/posts/${post.slug}`} className={styles.featuredPostCard}>
			<div className={styles.featuredPostImageWrapper}>
				<Image
					src={post.featuredImage.node.sourceUrl}
					alt={post.featuredImage.node.altText || post.title}
					width={1200}
					height={640}
					className={styles.featuredPostImage}
					priority
				/>
				<div className={styles.featuredPostOverlay} aria-hidden="true" />
			</div>
			<div className={styles.featuredPostContent}>
				<span className={styles.featuredPostDate}>{dateFormat(parseWpDate(post.date), "mmmm dS, yyyy")}</span>
				<h3 className={styles.featuredPostTitle}>{post.title}</h3>
			</div>
		</Link>
	);
});

FeaturedPostCard.displayName = 'FeaturedPostCard';

export default FeaturedPostCard;
