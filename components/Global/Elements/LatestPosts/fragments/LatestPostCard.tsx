/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC } from "react";
import Link from "next/link";
import Image from "next/image";
import DOMPurify from "isomorphic-dompurify";
import * as IPost from "@/graphql/CMS/types/post";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/Global/Elements/LatestPosts/styles/LatestPosts.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type ILatestPostCard = {
	post: IPost.ISummaryProps;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXX LatestPostCard Component XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders a single "Latest news" card. `featuredImage` is optional-chained since WP
 * posts aren't guaranteed to have one. `readingTime` comes from `post.seo` — the same
 * WPGraphQL Yoast field `app/posts/[slug]/page.tsx` reads for the current post itself.
 */
const LatestPostCard: FC<ILatestPostCard> = ({ post }) => {

	return (
		<div className={styles.latestPostCard}>
			{post.featuredImage?.node?.sourceUrl && (
				<div className={styles.latestPostImageWrapper}>
					<Image
						src={post.featuredImage.node.sourceUrl}
						alt={post.featuredImage.node.altText || post.title}
						width={480}
						height={320}
						className={styles.latestPostImage}
					/>
				</div>
			)}
			<div className={styles.latestPostMeta}>
				<span>Blog Post</span>
				{post.seo?.readingTime ? (
					<>
						<span className={styles.latestPostMetaDot} aria-hidden="true" />
						<span>{post.seo.readingTime} min read</span>
					</>
				) : null}
			</div>
			<Link href={`/posts/${post.slug}`} className={styles.latestPostTitleLink}>
				<h3 className={styles.latestPostTitle}>{post.title}</h3>
			</Link>
			{post.excerpt && (
				<div
					className={styles.latestPostExcerpt}
					dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.excerpt) }}
				/>
			)}
			{post.categories?.nodes?.length ? (
				<div className={styles.latestPostTags}>
					{post.categories.nodes.map((category) => (
						<span key={category.slug} className={styles.latestPostTag}>{category.name}</span>
					))}
				</div>
			) : null}
		</div>
	);
};

LatestPostCard.displayName = 'LatestPostCard';

export default LatestPostCard;
