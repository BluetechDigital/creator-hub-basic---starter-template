/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC } from "react";
import Image from "next/image";
import dateFormat from "dateformat";
import * as IPost from "@/graphql/CMS/types/post";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/app/posts/[slug]/styles/SinglePost.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IPostHero = {
	post: IPost.IProps;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX PostHero Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders the single post page's hero header: featured image, title, excerpt,
 * author (name — linked to `author.url` when present — avatar, and bio), date, and
 * read time. Plain presentational component, no data fetching of its own — `post`
 * is passed down already-resolved from `SinglePostPage`.
 * @param post The post's content fields, as returned by `getPostContentBySlug`.
 */
const PostHero: FC<IPostHero> = ({ post }) => {

	return (
		<header className={styles.postHero}>
			<div className={styles.postHeroInner}>
				{post.featuredImage?.node?.sourceUrl && (
					<div className={styles.postHeroImageWrapper}>
						<Image
							src={post.featuredImage.node.sourceUrl}
							alt={post.featuredImage.node.altText || post.title}
							width={720}
							height={640}
							className={styles.postHeroImage}
							priority
						/>
					</div>
				)}
				<div className={styles.postHeroContent}>
					<h1 className={styles.postTitle}>{post.title}</h1>
					{post.excerpt && (
						<p className={styles.postExcerpt}>
							{post.excerpt.replace(/<[^>]+>/g, '').trim()}
						</p>
					)}
					<div className={styles.postMeta}>
						{post.author?.node?.avatar?.url && (
							<Image
								width={32}
								height={32}
								alt={post.author.node.name}
								src={post.author.node.avatar.url}
								className={styles.postAuthorAvatar}
							/>
						)}
						{post.author?.node?.name && (
							post.author.node.url ? (
								<a
									href={post.author.node.url}
									target="_blank"
									rel="noopener noreferrer"
									className={styles.postMetaText}
								>
									{post.author.node.name}
								</a>
							) : (
								<span className={styles.postMetaText}>{post.author.node.name}</span>
							)
						)}
						<span className={styles.postMetaDot} aria-hidden="true" />
						<span className={styles.postMetaText}>{dateFormat(post.date, "dddd, mmmm dS, yyyy")}</span>
						{post.seo?.readingTime ? (
							<>
								<span className={styles.postMetaDot} aria-hidden="true" />
								<span className={styles.postMetaText}>{post.seo.readingTime} min read</span>
							</>
						) : null}
					</div>
					{post.author?.node?.description && (
						<p className={styles.postAuthorBio}>{post.author.node.description}</p>
					)}
				</div>
			</div>
		</header>
	);
};

PostHero.displayName = 'PostHero';

export default PostHero;
