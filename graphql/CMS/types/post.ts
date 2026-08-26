/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX POSTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/* ---- Single post (getPostContentBySlug) ---- */

export type IResponse = {
	posts: ({
        edges: { node: IProps }[];
    } | null) | null;
};

/** A single published blog post's rendering fields, as returned by `getPostContentBySlug`. */
export type IProps = {
	databaseId: number;
	title: string;
	slug: string;
	/** Actually WPGraphQL's `dateGmt` field, fetched under this name via a query alias — run through `parseWpDate` before use, never `new Date()` directly (see `GetPostContentBySlug.ts`'s doc comment for why). */
	date: string;
	/** Actually WPGraphQL's `modifiedGmt` field — same `parseWpDate` caveat as `date` above. */
	modified: string;
	content: string;
	excerpt: string;
	featuredImage?: { node: { sourceUrl: string; altText: string } } | null;
	author?: {
		node: {
			name: string;
			url?: string | null;
			description?: string | null;
			avatar?: { url: string } | null;
		};
	} | null;
	categories?: { nodes: { name: string; slug: string }[] } | null;
	/** Capped to the 5 most relevant tags at the query level — see `postSummaryFields.ts`. */
	tags?: { nodes: { name: string; slug: string }[] } | null;
	seo?: { readingTime: number } | null;
};

/* ---- List summaries (getAllPostsSummaries, getLatestPosts) ---- */

export type ISummaryProps = Pick<
	IProps,
	"title" | "slug" | "date" | "excerpt" | "featuredImage" | "categories" | "tags" | "seo"
>;

export type ISummaryResponse = {
	posts: ({
        nodes: ISummaryProps[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
    } | null) | null;
};

/**
 * Archive-grid filters accepted by `getAllPostsSummaries`. Category filtering is
 * deliberately single-select (`categorySlug`, not an array) — it maps to WPGraphQL's
 * slug-based `categoryName` where-arg, confirmed working directly against this
 * project's live CMS; the multi-select alternative (`categoryIn`) takes numeric
 * category *database IDs*, not slugs, which would need an extra slug→ID lookup query
 * this pass doesn't add. `dateFrom`/`dateTo` are plain `"YYYY-MM-DD"` strings — split
 * into WPGraphQL's `{year, month, day}` shape by `buildDateQueryInput` in
 * `GetAllPostsSummaries.ts`, not passed through as-is.
 */
export type IPostFilters = {
	tagSlugs?: string[];
	categorySlug?: string;
	dateFrom?: string;
	dateTo?: string;
	/** Free-text title/content search — maps to WPGraphQL's `search` where-arg (standard `WP_Query` `s` behaviour, so it matches post content too, not just the title). */
	search?: string;
};

/**
 * Splits a comma-separated `tag` query param (`"ai,ai-collections"`) into a
 * trimmed, non-empty slug list. Shared by `app/posts/page.tsx` (server-side
 * filtering) and `PostFilters.tsx` (the chip row's client-side read of the
 * same URL) so both parse `?tag=` identically — these two call sites used to
 * each hand-roll this split, and had already drifted (one trimmed whitespace,
 * the other didn't), silently disagreeing on edge cases like `?tag=ai,
 * ai-collections` (a space after the comma).
 * @param raw The raw `tag` query param value, or `null`/`undefined` if unset.
 */
export const parseTagSlugs = (raw?: string | null): string[] =>
	raw ? raw.split(',').map((slug) => slug.trim()).filter(Boolean) : [];

/**
 * Whether any archive filter is active. Shared for the same reason
 * `parseTagSlugs` is — `app/posts/page.tsx` (to decide `robots.index`) and
 * `PostFilters.tsx` (to show/hide "Clear filters") used to each reimplement
 * this exact four-field check under the same name, with nothing forcing the
 * two definitions to stay in sync if a filter field is ever added.
 * @param filters The currently-active archive filters.
 */
export const hasActiveFilters = (filters: IPostFilters): boolean =>
	Boolean(filters.tagSlugs?.length || filters.categorySlug || filters.dateFrom || filters.dateTo || filters.search);

/* ---- Sitemap slugs (getAllPostsSlugs) ---- */

/** A single published post's slug and last-modified date, mirroring `graphql/CMS/types/page.ts`'s `IProps`. */
export type ISlugProps = {
	slug: string;
	modified: string;
};

export type ISlugsResponse = {
	posts: ({
        nodes: ISlugProps[];
    } | null) | null;
};
