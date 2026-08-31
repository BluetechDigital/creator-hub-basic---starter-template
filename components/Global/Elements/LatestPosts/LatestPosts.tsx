/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { getLatestPosts } from "@/graphql/CMS/GetLatestPosts";
import { getLocale } from "@/i18n/getLocale";
import { getDictionary } from "@/i18n/dictionaries";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/Global/Elements/LatestPosts/styles/LatestPosts.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import LatestPostCard from "@/components/Global/Elements/LatestPosts/fragments/LatestPostCard";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type ILatestPosts = {
	excludePostId: number;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX LatestPosts Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders the "Latest news" section at the bottom of a single post page: up to 3
 * other published posts, newest first, excluding the post currently being viewed
 * (`excludePostId`). Async Server Component — data is fetched inside the component
 * body rather than module scope, same fetch convention as `AllBlogPosts`/
 * `AllYoutubeVideos` (see ARCHITECTURE.md §2). Renders nothing (not an empty
 * section) when there are no other posts to show yet — same graceful-empty-state
 * convention as `PostsGrid`. Reads the current locale directly (`getLocale()`) for
 * its own "The latest news"/"From the blog" static UI strings, same self-fetching
 * pattern as `PostTaxonomies.tsx`.
 * @param excludePostId The `databaseId` of the post currently being viewed.
 */
const LatestPosts = async ({ excludePostId }: ILatestPosts) => {

	let posts: Awaited<ReturnType<typeof getLatestPosts>> = [];

	try {
		posts = await getLatestPosts(excludePostId, 3) ?? [];
	} catch (error) {
		console.log(error);
	}

	if (!posts || posts.length === 0) return null;

	const locale = await getLocale();
	const dict = await getDictionary(locale);

	return (
		<section className={styles.latestPosts}>
			<span className={styles.latestPostsEyebrow}>{dict.latestPosts.eyebrow}</span>
			<h2 className={styles.latestPostsHeading}>{dict.latestPosts.heading}</h2>
			<div className={styles.latestPostsGrid}>
				{posts.map((post) => (
					<LatestPostCard key={post.slug} post={post} />
				))}
			</div>
		</section>
	);
};

LatestPosts.displayName = 'LatestPosts';

export default LatestPosts;
