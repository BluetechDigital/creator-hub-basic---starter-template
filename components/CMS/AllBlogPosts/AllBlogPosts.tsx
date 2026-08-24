/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IAllBlogPosts from "@/components/CMS/AllBlogPosts/types/allBlogPosts";
import { getAllPostsSummaries } from "@/graphql/CMS/GetAllPostsSummaries";
import { getPostFilterOptions, IPostFilterOptions } from "@/graphql/CMS/GetPostFilterOptions";

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

// Shown when the ACF `title` field (see types/allBlogPosts.ts's doc comment) is
// absent — either because it hasn't been queried yet, or because a CMS editor
// hasn't filled it in on this particular fork.
const DEFAULT_HEADING = "Latest from the blog";

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
 * @param title See the `IProps` doc comment above.
 * @param filters The archive's active tag/category/date filters, parsed
 * server-side in `app/posts/page.tsx` from this route's query params.
 */
const AllBlogPosts = async ({ title, filters }: IAllBlogPosts.IProps) => {

	let posts: IAllBlogPosts.IPostsGrid["posts"] = [];
	let categories: IPostFilterOptions["categories"] = [];
	let tags: IPostFilterOptions["tags"] = [];

	try {
		const [summaries, filterOptions] = await Promise.all([
			getAllPostsSummaries(POSTS_PAGE_SIZE, undefined, filters),
			getPostFilterOptions(),
		]);
		posts = summaries?.posts ?? [];
		categories = filterOptions?.categories ?? [];
		tags = filterOptions?.tags ?? [];
	} catch (error) {
		console.log(error);
	}

	return (
		<div className={styles.allBlogPosts}>
			<div className={styles.allBlogPostsHeader}>
				<span className={styles.allBlogPostsEyebrow}>Blogs</span>
				<h2 className={styles.allBlogPostsHeading}>{title || DEFAULT_HEADING}</h2>
			</div>
			<PostFilters categories={categories} tags={tags} />
			<PostsGrid posts={posts} />
		</div>
	);
};

export default AllBlogPosts;
