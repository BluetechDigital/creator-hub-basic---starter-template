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
	title: string;
	slug: string;
	date: string;
	modified: string;
	content: string;
	excerpt: string;
	featuredImage?: { node: { sourceUrl: string; altText: string } } | null;
	author?: { node: { name: string } } | null;
	categories?: { nodes: { name: string; slug: string }[] } | null;
};

/* ---- List summaries (getAllPostsSummaries) ---- */

export type ISummaryProps = Pick<IProps, "title" | "slug" | "date" | "excerpt" | "featuredImage">;

export type ISummaryResponse = {
	posts: ({
        nodes: ISummaryProps[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
    } | null) | null;
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
