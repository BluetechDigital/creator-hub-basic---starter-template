/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import Link from "next/link";
import Image from "next/image";
import DOMPurify from "isomorphic-dompurify";
import * as IPost from "@/graphql/CMS/types/post";
import { getLocale } from "@/i18n/getLocale";
import { getDictionary, formatTemplate } from "@/i18n/dictionaries";

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
 * WPGraphQL Yoast field `app/[locale]/posts/[slug]/page.tsx` reads for the current post itself.
 *
 * The grey pill row prefers the post's tags (already capped to 5 by the query — see
 * `postSummaryFields.ts`) and falls back to its categories only when it has no tags at
 * all, since a freshly published post is far more likely to be left in the default
 * "Uncategorized" category than to have no tags set. Each pill links to
 * `/posts?tag=<slug>` (or `?category=<slug>` when falling back) — the same archive-filter
 * query params `PostFilters.tsx` reads/writes, so clicking one lands on the archive
 * already filtered to it.
 */
const LatestPostCard = async ({ post }: ILatestPostCard) => {

	const locale = await getLocale();
	const dict = await getDictionary(locale);

	const tagNodes = post.tags?.nodes ?? [];
	const isTagPills = tagNodes.length > 0;
	const pills = isTagPills ? tagNodes : post.categories?.nodes ?? [];
	const pillFilterKey = isTagPills ? 'tag' : 'category';

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
				<span>{dict.latestPosts.blogPost}</span>
				{post.seo?.readingTime ? (
					<>
						<span className={styles.latestPostMetaDot} aria-hidden="true" />
						<span>{formatTemplate(dict.latestPosts.minRead, { count: String(post.seo.readingTime) })}</span>
					</>
				) : null}
			</div>
			<Link href={`/${locale}/posts/${post.slug}`} className={styles.latestPostTitleLink}>
				<h3 className={styles.latestPostTitle}>{post.title}</h3>
			</Link>
			{post.excerpt && (
				<div
					className={styles.latestPostExcerpt}
					dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.excerpt) }}
				/>
			)}
			{pills.length ? (
				<div className={styles.latestPostTags}>
					{pills.map((pill) => (
						<Link
							key={pill.slug}
							href={`/${locale}/posts?${pillFilterKey}=${pill.slug}`}
							className={styles.latestPostTag}
						>
							{pill.name}
						</Link>
					))}
				</div>
			) : null}
		</div>
	);
};

LatestPostCard.displayName = 'LatestPostCard';

export default LatestPostCard;
