/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IAllBlogPosts from "@/components/CMS/AllBlogPosts/types/allBlogPosts";
import { getAllPostsSummaries } from "@/graphql/CMS/GetAllPostsSummaries";
import { getPostFilterOptions, IPostFilterOptions } from "@/graphql/CMS/GetPostFilterOptions";

// Static UI Dictionary + CMS content translation
import { getLocale } from "@/i18n/getLocale";
import { getDictionary } from "@/i18n/dictionaries";
import { translatePostSummaries } from "@/i18n/translateContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/AllBlogPosts/styles/AllBlogPosts.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import PostFilters from "@/components/CMS/AllBlogPosts/fragments/PostFilters";
import PostsGrid from "@/components/CMS/AllBlogPosts/fragments/PostsGrid";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Configuration XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// No "Load more" UI yet — getAllPostsSummaries already returns a cursor/pageInfo
// pair, so a future paginated control only needs to call it again with `after`,
// not change the query shape.
const POSTS_PAGE_SIZE = 24;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXX AllBlogPosts Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders the blog archive's header (a static "Blogs" eyebrow + the ACF `title`
 * field as the heading), the `PostFilters` bar, and the grid of published post
 * summaries. Async Server Component — data is fetched inside the component body
 * rather than at module scope so it runs per-request, matching Next's per-request
 * fetch caching/revalidation (see ARCHITECTURE.md §2's fetch convention, applied
 * here too).
 *
 * `getAllPostsSummaries` throws on a network/fetch-level failure (not just a
 * resolved-`undefined` GraphQL error) — caught here so a CMS blip degrades to an
 * empty grid instead of crashing the whole archive page. `getPostFilterOptions`
 * never throws (see its own doc comment) and is fetched in parallel since it's
 * independent of the posts fetch.
 *
 * `translatePostSummaries` (`i18n/translateContent.ts`) machine-translates
 * each post's `title`/`excerpt` for non-English locales — a no-op for
 * English, since the CMS is only ever written to in English. Category/tag
 * *names* shown in `PostFilters` are deliberately left untranslated here —
 * Phase 1's scope is post title/excerpt/content and SEO text, not taxonomy
 * labels.
 * @param title See the `IProps` doc comment above.
 * @param filters The archive's active tag/category/date filters, parsed
 * server-side in `app/[locale]/posts/page.tsx` from this route's query params.
 */
const AllBlogPosts = async ({ title, filters }: IAllBlogPosts.IProps) => {

	const locale = await getLocale();
	const dict = await getDictionary(locale);

	let posts: IAllBlogPosts.IPostsGrid["posts"] = [];
	let categories: IPostFilterOptions["categories"] = [];
	let tags: IPostFilterOptions["tags"] = [];

	try {
		const [summaries, filterOptions] = await Promise.all([
			getAllPostsSummaries(POSTS_PAGE_SIZE, undefined, filters),
			getPostFilterOptions(),
		]);
		posts = await translatePostSummaries(summaries?.posts ?? []);
		categories = filterOptions?.categories ?? [];
		tags = filterOptions?.tags ?? [];
	} catch (error) {
		console.log(error);
	}

	return (
		<div className={styles.allBlogPosts}>
			<div className={styles.allBlogPostsHeader}>
				<span className={styles.allBlogPostsEyebrow}>{dict.posts.eyebrow}</span>
				<h2 className={styles.allBlogPostsHeading}>{title || dict.posts.defaultHeading}</h2>
			</div>
			<PostFilters categories={categories} tags={tags} dict={{ ...dict.posts, ...dict.common }} />
			<PostsGrid posts={posts} dict={{ ...dict.posts, ...dict.common }} />
		</div>
	);
};

export default AllBlogPosts;
