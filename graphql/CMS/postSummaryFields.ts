import * as IPost from "@/graphql/CMS/types/post";
import { rewriteCmsMediaUrl, rewriteCmsUrlsInHtml } from "@/config/cmsMediaUrl";

/**
 * The `Post` field-selection shared by every query that returns a list of
 * post summaries (`GetAllPostsSummaries.ts`'s archive grid, `GetLatestPosts.ts`'s
 * "Latest news" section) — both fetch exactly the fields `IPost.ISummaryProps`
 * declares, so a future field addition only has to be made once here instead
 * of drifting between two hand-duplicated copies.
 *
 * `date: dateGmt` aliases WPGraphQL's GMT field back onto `date` — see
 * `GetPostContentBySlug.ts`'s doc comment for why, and why callers must use
 * `parseWpDate` rather than `new Date()` on it.
 *
 * `tags(first: 5)` caps the tag pills `LatestPostCard` renders at the source
 * rather than slicing client-side — `categories` is still fetched alongside it
 * so that card can fall back to the category pill when a post has no tags.
 */
export const POST_SUMMARY_FIELDS = `
	title
	slug
	date: dateGmt
	excerpt
	featuredImage {
		node {
			sourceUrl
			altText
		}
	}
	categories {
		nodes {
			name
			slug
		}
	}
	tags(first: 5) {
		nodes {
			name
			slug
		}
	}
	seo {
		readingTime
	}
`;

/**
 * Rewrites every CMS-origin URL in a page of post summaries — the featured
 * image and any image/document link embedded in the excerpt's WYSIWYG HTML —
 * to this app's own `/api/media/...` proxy path (`config/cmsMediaUrl.ts`).
 * Shared by `GetAllPostsSummaries.ts` and `GetLatestPosts.ts`, the same two
 * callers `POST_SUMMARY_FIELDS` above is shared by, so both stay in sync.
 * @param nodes Raw post-summary nodes, exactly as WPGraphQL returned them.
 */
export const rewritePostSummaryMediaUrls = (nodes: IPost.ISummaryProps[]): IPost.ISummaryProps[] =>
	nodes.map((node) => ({
		...node,
		excerpt: rewriteCmsUrlsInHtml(node.excerpt),
		featuredImage: node.featuredImage?.node?.sourceUrl
			? { node: { ...node.featuredImage.node, sourceUrl: rewriteCmsMediaUrl(node.featuredImage.node.sourceUrl) } }
			: node.featuredImage,
	}));
