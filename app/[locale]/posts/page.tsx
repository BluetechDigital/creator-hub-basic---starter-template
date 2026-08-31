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

// CMS content translation + locale-aware SEO
import { translateFields } from "@/i18n/translateContent";
import { buildLocaleAlternates } from "@/i18n/buildAlternates";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import RenderFlexibleContent from "@/components/CMS/FlexibleContent/RenderFlexibleContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Raw archive-filter query params, before `parseFiltersFromSearchParams` below
 * turns them into `IPost.IPostFilters`. Each value is `string | string[]` (not
 * just `string`) because that's what Next.js's App Router actually hands a
 * page for a *repeated* query key (`?tag=a&tag=b` → `tag: ["a", "b"]`) — see
 * `toSingleParam`'s doc comment for what happens if that case isn't handled.
 */
type ISearchParams = {
	tag?: string | string[];
	category?: string | string[];
	from?: string | string[];
	to?: string | string[];
	search?: string | string[];
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Filter Parsing XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Collapses a `string | string[] | undefined` query param down to a single
 * `string | undefined`, taking the first value when a key was repeated in the
 * URL. Confirmed live: without this, a crafted/malformed link like
 * `?tag=ai&tag=news` makes `searchParams.tag` an array, and calling
 * `.split(',')` on it directly throws (arrays have no `.split`), 500-ing the
 * entire `/posts` route rather than just ignoring the duplicate key.
 * @param value A single query param's raw value, as Next.js provides it.
 */
const toSingleParam = (value: string | string[] | undefined): string | undefined =>
	Array.isArray(value) ? value[0] : value;

/**
 * Turns this route's raw `?tag=&category=&from=&to=` query params into
 * `IPost.IPostFilters` — shared by `generateMetadata` (to decide `robots.index`)
 * and `PostsArchivePage` (to actually filter the grid) so both agree on what
 * counts as "a filter is active" from the exact same parsing logic. `tag`
 * parsing itself is shared further still, via `IPost.parseTagSlugs` — also
 * used by `PostFilters.tsx`'s client-side read of the same `?tag=` param, so
 * the two can't quietly disagree on edge cases the way they used to.
 * `category`/`from`/`to` are single values. Every field is run through
 * `toSingleParam` first since a repeated query key resolves to an array, not
 * a string.
 * @param searchParams This route's raw query params.
 */
const parseFiltersFromSearchParams = (searchParams: ISearchParams): IPost.IPostFilters => {
	const tagSlugs = IPost.parseTagSlugs(toSingleParam(searchParams.tag));

	return {
		tagSlugs: tagSlugs.length ? tagSlugs : undefined,
		categorySlug: toSingleParam(searchParams.category),
		dateFrom: toSingleParam(searchParams.from),
		dateTo: toSingleParam(searchParams.to),
		search: toSingleParam(searchParams.search),
	};
};

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
 * SEO text fields are machine-translated for non-English locales via
 * `translateFields` (a no-op for English). `alternates` is rebuilt via
 * `buildLocaleAlternates`, always pointing at the plain (unfiltered) locale
 * URL — same "filtered views canonicalize back to the main archive" behavior
 * as before, just locale-aware now.
 * @param params - Route params promise; resolves to `{locale}`.
 * @param searchParams This route's raw query params — same shape `PostsArchivePage`
 * receives, so both resolve filters identically.
 * @returns Next.js `Metadata` for the blog archive page, or minimal no-index metadata
 * if the WP "Blog" page this route depends on doesn't exist yet (a fresh fork, before
 * anyone's created it) — `PostsArchivePage` below is what actually 404s; this just has
 * to avoid crashing on `seo` being `undefined` in the meantime (same pattern as
 * `app/[locale]/[slug]/page.tsx`'s `generateMetadata`).
 */
export const generateMetadata = async ({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<ISearchParams> }): Promise<Metadata> => {

	const { locale } = await params;
	const seo = await getAllSeoContent(pageType?.posts, postType.pages) as ISeo.IProps | undefined;

	if (!seo) {
		return { robots: { follow: false, index: false } };
	}

	const filtered = IPost.hasActiveFilters(parseFiltersFromSearchParams(await searchParams));

	const translatedSeo = await translateFields({
		title: seo.title,
		metaDesc: seo.metaDesc,
		opengraphTitle: seo.opengraphTitle,
		opengraphDescription: seo.opengraphDescription,
	});

	return {
		title: translatedSeo.title,
		description: translatedSeo.metaDesc,
		openGraph: {
			type: 'website',
			url: seo.opengraphUrl,
			title: translatedSeo.opengraphTitle,
			siteName: seo.opengraphSiteName,
			description: translatedSeo.opengraphDescription,
		},
		alternates: buildLocaleAlternates(locale, '/posts'),
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
 * `app/[locale]/[slug]/page.tsx` (see `ARCHITECTURE.md` §1), fixed to `pageType.posts` — the
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
 * crashing on a `null` `content` prop, matching `app/[locale]/[slug]/page.tsx`'s `DynamicPages`.
 *
 * Reading `searchParams` (the archive's tag/category/date filters) makes this route
 * dynamic rather than statically prerendered — the same class Next already puts
 * `app/[locale]/[slug]/page.tsx` and `app/[locale]/posts/[slug]/page.tsx` in, not a regression specific
 * to this page. `getAllPostsSummaries`'s own `next: { revalidate }` fetch-level cache
 * is unaffected; only this page shell stops being prebuilt at build time. Filters are
 * parsed once via `parseFiltersFromSearchParams` (shared with `generateMetadata` above)
 * and threaded down through `RenderFlexibleContent` to whichever block actually uses
 * them (`AllBlogPosts`) — every other block on the page just ignores the extra prop,
 * the same way they already ignore whichever of their sibling blocks' ACF fields don't
 * apply to them.
 */
const PostsArchivePage: NextPage<{ searchParams: Promise<ISearchParams> }> = async ({ searchParams }) => {

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
