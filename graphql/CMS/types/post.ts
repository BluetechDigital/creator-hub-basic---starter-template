/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX POSTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IComment from "@/graphql/CMS/types/comment";

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
	date: string;
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
	seo?: { readingTime: number } | null;
	/** Custom counter from the creator-hub-likes mu-plugin — 0 if that plugin isn't installed yet. */
	likes?: number | null;
	commentCount?: number | null;
	comments?: {
		nodes: IComment.IProps[];
		pageInfo: { hasNextPage: boolean; endCursor: string | null };
	} | null;
};

/* ---- List summaries (getAllPostsSummaries, getLatestPosts) ---- */

export type ISummaryProps = Pick<
	IProps,
	"title" | "slug" | "date" | "excerpt" | "featuredImage" | "categories" | "seo"
>;

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
