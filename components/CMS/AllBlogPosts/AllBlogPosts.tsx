/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IAllBlogPosts from "@/components/CMS/AllBlogPosts/types/allBlogPosts";
import { getAllPostsSummaries } from "@/graphql/CMS/GetAllPostsSummaries";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/AllBlogPosts/styles/AllBlogPosts.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

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
 * Renders the blog archive's grid of published post summaries. Async Server
 * Component — data is fetched inside the component body rather than at module
 * scope so it runs per-request, matching Next's per-request fetch caching/
 * revalidation (see ARCHITECTURE.md §2's fetch convention, applied here too).
 */
const AllBlogPosts = async ({}: IAllBlogPosts.IProps) => {

	const summaries = await getAllPostsSummaries(POSTS_PAGE_SIZE);
	const posts = summaries?.posts ?? [];

	return (
		<div className={styles.allBlogPosts}>
			<PostsGrid posts={posts} />
		</div>
	);
};

export default AllBlogPosts;
