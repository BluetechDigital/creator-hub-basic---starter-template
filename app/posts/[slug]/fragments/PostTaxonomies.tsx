/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, Fragment } from "react";
import Link from "next/link";
import * as IPost from "@/graphql/CMS/types/post";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/app/posts/[slug]/styles/SinglePost.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IPostTaxonomies = {
	categories: IPost.IProps["categories"];
	tags: IPost.IProps["tags"];
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXX PostTaxonomies Component XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders a post's categories and tags directly above `EngagementBar` in
 * `PostHero` — categories as plain text links (styled identically to the
 * author meta line, not a pill), tags as the same grey pill treatment
 * `LatestPostCard` uses for its "Latest news" cards. `tags` is already capped
 * to 5 at the query level (see `GetPostContentBySlug.ts`), not sliced here.
 * Renders nothing if the post has neither.
 *
 * Each category/tag links to `/posts?category=<slug>` / `/posts?tag=<slug>` —
 * the same archive-filter query params `PostFilters.tsx` reads/writes, so
 * clicking one lands on the archive already filtered to it.
 * @param categories The post's categories, as returned by `getPostContentBySlug`.
 * @param tags The post's tags (max 5), as returned by `getPostContentBySlug`.
 */
const PostTaxonomies: FC<IPostTaxonomies> = ({ categories, tags }) => {

	const categoryNodes = categories?.nodes ?? [];
	const tagNodes = tags?.nodes ?? [];

	if (!categoryNodes.length && !tagNodes.length) return null;

	return (
		<div className={styles.postTaxonomies}>
			{categoryNodes.length > 0 && (
				<span className={styles.postTaxonomiesCategories}>
					{categoryNodes.map((category, index) => (
						<Fragment key={category.slug}>
							{index > 0 && ', '}
							<Link href={`/posts?category=${category.slug}`} className={styles.postTaxonomiesCategoryLink}>
								{category.name}
							</Link>
						</Fragment>
					))}
				</span>
			)}
			{tagNodes.length > 0 && (
				<div className={styles.postTaxonomiesTags}>
					{tagNodes.map((tag) => (
						<Link key={tag.slug} href={`/posts?tag=${tag.slug}`} className={styles.postTaxonomyTag}>
							{tag.name}
						</Link>
					))}
				</div>
			)}
		</div>
	);
};

PostTaxonomies.displayName = 'PostTaxonomies';

export default PostTaxonomies;
