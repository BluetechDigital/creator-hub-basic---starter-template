/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import Image from "next/image";
import * as IPost from "@/graphql/CMS/types/post";
import { parseWpDate } from "@/graphql/CMS/parseWpDate";
import { getLocale } from "@/i18n/getLocale";
import { getDictionary, formatTemplate } from "@/i18n/dictionaries";
import { formatLocaleDate } from "@/i18n/formatLocaleDate";
import EngagementBar from "@/app/[locale]/posts/[slug]/fragments/EngagementBar";
import PostTaxonomies from "@/app/[locale]/posts/[slug]/fragments/PostTaxonomies";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/app/[locale]/posts/[slug]/styles/SinglePost.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IPostHero = {
	post: IPost.IProps;
	initialLikes: number;
	initialDislikes: number;
	commentCount: number;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX PostHero Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders the single post page's hero header: featured image, title, excerpt,
 * author (name — linked to `author.url` when present — avatar, and bio), date,
 * read time, and the like/dislike/comment-count engagement pill. Async Server
 * Component — reads the current locale directly (`getLocale()`) for its own
 * date formatting/"min read" text and to pass `dict.singlePost` down to
 * `EngagementBar` (a Client Component, so it can't call `getDictionary()`
 * itself) — same self-fetching pattern as `PostTaxonomies.tsx`/`TableOfContents.tsx`.
 * `post` and the reaction/comment counts are still passed down already-resolved
 * from `SinglePostPage`.
 *
 * The date is formatted via `formatLocaleDate` (native `Intl.DateTimeFormat`),
 * not the `dateformat` package this used to use — see that helper's own doc
 * comment for why (its i18n plugin isn't safe under Next's concurrent server
 * process).
 *
 * `EngagementBar` sits directly below the author bio (not after the article
 * body, where it originally lived) so a reader can react without scrolling
 * past the whole post first. `PostTaxonomies` (categories/tags) sits between
 * the bio and `EngagementBar`.
 * @param post The post's content fields, as returned by `getPostContentBySlug`.
 * @param initialLikes The post's current like count (`getPostReactions`, 0 if the likes mu-plugin isn't installed).
 * @param initialDislikes The post's current dislike count (`getPostReactions`, 0 if the likes mu-plugin isn't installed).
 * @param commentCount The post's approved comment count.
 */
const PostHero = async ({ post, initialLikes, initialDislikes, commentCount }: IPostHero) => {

	const locale = await getLocale();
	const dict = await getDictionary(locale);

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
						<span className={styles.postMetaText}>{formatLocaleDate(parseWpDate(post.date), locale, true)}</span>
						{post.seo?.readingTime ? (
							<>
								<span className={styles.postMetaDot} aria-hidden="true" />
								<span className={styles.postMetaText}>{formatTemplate(dict.singlePost.minRead, { count: String(post.seo.readingTime) })}</span>
							</>
						) : null}
					</div>
					{post.author?.node?.description && (
						<p className={styles.postAuthorBio}>{post.author.node.description}</p>
					)}
					<PostTaxonomies categories={post.categories} tags={post.tags} />
					<EngagementBar
						postId={post.databaseId}
						initialLikes={initialLikes}
						initialDislikes={initialDislikes}
						commentCount={commentCount}
						dict={dict.singlePost}
					/>
				</div>
			</div>
		</header>
	);
};

PostHero.displayName = 'PostHero';

export default PostHero;
