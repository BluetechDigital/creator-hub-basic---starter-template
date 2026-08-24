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
};

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
