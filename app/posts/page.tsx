/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { Metadata, NextPage } from "next";
import { notFound } from "next/navigation";
import * as ISeo from "@/graphql/CMS/types/seo";
import * as IPost from "@/graphql/CMS/types/post";
import * as IFlexibleContent from "@/graphql/CMS/types/flexibleContent";
import { postType, flexibleContentType, pageType } from "@/context/constants";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Queries Functions XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { getAllSeoContent } from "@/graphql/CMS/GetAllSeoContent";
import { getAllPageACFFlexibleComponentsContent } from "@/graphql/CMS/GetAllPageACFFlexibleComponentsContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import RenderFlexibleContent from "@/components/CMS/FlexibleContent/RenderFlexibleContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/** Raw archive-filter query params, before `parseFiltersFromSearchParams` below turns them into `IPost.IPostFilters`. */
type ISearchParams = {
	tag?: string;
	category?: string;
	from?: string;
	to?: string;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Filter Parsing XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Turns this route's raw `?tag=&category=&from=&to=` query params into
 * `IPost.IPostFilters` — shared by `generateMetadata` (to decide `robots.index`)
 * and `PostsArchivePage` (to actually filter the grid) so both agree on what
 * counts as "a filter is active" from the exact same parsing logic.
 * `tag` is comma-separated (`?tag=ai,ai-collections`) since `tagSlugIn` accepts
 * multiple slugs; `category`/`from`/`to` are single values.
 * @param searchParams This route's raw query params.
 */
const parseFiltersFromSearchParams = (searchParams: ISearchParams): IPost.IPostFilters => ({
	tagSlugs: searchParams.tag
		? searchParams.tag.split(',').map((slug) => slug.trim()).filter(Boolean)
		: undefined,
	categorySlug: searchParams.category,
	dateFrom: searchParams.from,
	dateTo: searchParams.to,
});

const hasActiveFilters = (filters: IPost.IPostFilters): boolean =>
	Boolean(filters.tagSlugs?.length || filters.categorySlug || filters.dateFrom || filters.dateTo);

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Metadata XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Builds Next.js `<head>` metadata (title, description, Open Graph, canonical, robots)
 * for the blog archive page, by querying WPGraphQL SEO fields for `pageType.posts`.
 *
 * When any archive filter is active (`?tag=`/`category=`/`from=`/`to=`), `robots.index`
 * is forced to `false` — `canonical` already points at the plain `/posts` URL either way
 * (Yoast's computed value for this fixed WP page, never the visitor's live query string),
 * so filtered views naturally canonicalize back to the main archive without extra
 * handling here. Filtered views are a browsing aid for visitors, not pages that should
 * compete with the main archive in search results (classic faceted-navigation
 * duplicate-content territory).
 *
 * @param searchParams This route's raw query params — same shape `PostsArchivePage`
 * receives, so both resolve filters identically.
 * @returns Next.js `Metadata` for the blog archive page, or minimal no-index metadata
 * if the WP "Blog" page this route depends on doesn't exist yet (a fresh fork, before
 * anyone's created it) — `PostsArchivePage` below is what actually 404s; this just has
 * to avoid crashing on `seo` being `undefined` in the meantime (same pattern as
 * `app/[slug]/page.tsx`'s `generateMetadata`).
 */
export const generateMetadata = async ({ searchParams }: { searchParams: ISearchParams }): Promise<Metadata> => {

	const seo = await getAllSeoContent(pageType?.posts, postType.pages) as ISeo.IProps | undefined;

	if (!seo) {
		return { robots: { follow: false, index: false } };
	}

	const filtered = hasActiveFilters(parseFiltersFromSearchParams(await searchParams));

	return {
		title: seo.title,
		description: seo.metaDesc,
		openGraph: {
			type: 'website',
			url: seo.opengraphUrl,
			title: seo.opengraphTitle,
			siteName: seo.opengraphSiteName,
			description: seo.opengraphDescription
		},
		alternates: {
			canonical: seo?.canonical,
		},
		robots: {
			follow: true,
			index: !filtered
		}
	};
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXX Blog Archive Page Component XXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders the blog archive page. Same CMS flexible-content pipeline as
 * `app/[slug]/page.tsx` (see `ARCHITECTURE.md` §1), fixed to `pageType.posts` — the
 * WP *Page* that hosts the archive, not to be confused with `postType.posts` (the WP
 * post type queried by the `AllBlogPosts` block below for the actual posts). It
 * fetches this page's ACF flexible-content blocks via
 * `getAllPageACFFlexibleComponentsContent` and hands them straight to
 * `RenderFlexibleContent`, which resolves each block to a component via
 * `DynamicComponentLoaders` further down the tree — including `AllBlogPosts`, which
 * a CMS editor places on this page to render the actual grid.
 *
 * `getAllPageACFFlexibleComponentsContent` resolves to `null` if the WP "Blog" page
 * doesn't exist yet (a fresh fork, before anyone's created it in wp-admin) or on a
 * network-level failure — both cases 404 cleanly here instead of `RenderFlexibleContent`
 * crashing on a `null` `content` prop, matching `app/[slug]/page.tsx`'s `DynamicPages`.
 *
 * Reading `searchParams` (the archive's tag/category/date filters) makes this route
 * dynamic rather than statically prerendered — the same class Next already puts
 * `app/[slug]/page.tsx` and `app/posts/[slug]/page.tsx` in, not a regression specific
 * to this page. `getAllPostsSummaries`'s own `next: { revalidate }` fetch-level cache
 * is unaffected; only this page shell stops being prebuilt at build time. Filters are
 * parsed once via `parseFiltersFromSearchParams` (shared with `generateMetadata` above)
 * and threaded down through `RenderFlexibleContent` to whichever block actually uses
 * them (`AllBlogPosts`) — every other block on the page just ignores the extra prop,
 * the same way they already ignore whichever of their sibling blocks' ACF fields don't
 * apply to them.
 */
const PostsArchivePage: NextPage<{ searchParams: ISearchParams }> = async ({ searchParams }) => {

	let pageACFFlexibleComponentsContent: IFlexibleContent.IProps | null = null;

	try {
		pageACFFlexibleComponentsContent = await getAllPageACFFlexibleComponentsContent(
			pageType.posts,
			postType.pages,
			flexibleContentType.pages
		) as IFlexibleContent.IProps | null;
	} catch (error) {
		console.log(error);
	}

	if (!pageACFFlexibleComponentsContent) {
		notFound();
	}

	const filters = parseFiltersFromSearchParams(await searchParams);

	return <RenderFlexibleContent content={pageACFFlexibleComponentsContent} filters={filters} />;
}

PostsArchivePage.displayName = 'PostsArchivePage';

export default PostsArchivePage;
