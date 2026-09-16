/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import "server-only";
import { wordpressAuthHeaders } from "@/config/wordpressAuth";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const CMS_URL: string | undefined = process.env.CMS_URL;
// Optional — a category to file every generated article under (e.g. "Video
// Articles"), created once by hand in wp-admin. Uncategorised is fine too.
const WP_VIDEO_ARTICLE_CATEGORY_ID: string | undefined = process.env.WP_VIDEO_ARTICLE_CATEGORY_ID;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Video Article Slug XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Builds the deterministic WordPress post slug a generated article for `videoId`
 * always gets, regardless of whatever title the article rewrite actually
 * produces — mirrors `buildVideoSlug`/`getVideoIdFromSlug`'s fixed-ID-suffix
 * trick in `api/YouTube/GetAllYoutubeContent.ts`. This is what makes
 * `videoArticleExists` a single deterministic lookup rather than needing a new
 * custom field/meta registration in WordPress just to remember which video an
 * article came from.
 * @param videoId The source YouTube video's ID.
 */
export const buildVideoArticleSlug = (videoId: string): string => `video-article-${videoId}`;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Existing Article Check XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Checks whether a video already has a generated article — in **any** status,
 * not just published. An unauthenticated WPGraphQL query can only ever see
 * published posts, so a previously-created but still-unreviewed *draft* would
 * be invisible to a GraphQL-based check and get silently regenerated (and
 * re-billed against the Anthropic API) on every cron run; this REST lookup is
 * authenticated via `wordpressAuthHeaders()` specifically so `status=any`
 * actually includes drafts.
 * @param videoId The source YouTube video's ID.
 * @returns Whether a post with this video's deterministic slug already exists.
 */
export const videoArticleExists = async (videoId: string): Promise<boolean> => {
	if (!CMS_URL) throw new Error("CMS_URL not defined.");

	const slug = buildVideoArticleSlug(videoId);
	const url = `${CMS_URL}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&status=any`;

	const response = await fetch(url, { headers: wordpressAuthHeaders() });

	if (!response.ok) {
		throw new Error(`WordPress REST API error checking for an existing video article (${response.status}).`);
	}

	const posts: unknown = await response.json();
	return Array.isArray(posts) && posts.length > 0;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Create Draft Article XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type ICreateVideoArticleDraftArgs = {
	/** The source YouTube video's ID — becomes this post's deterministic slug via `buildVideoArticleSlug`. */
	videoId: string;
	/** The generated article's title (distinct from the raw video title — see `generateArticleFromTranscript`). */
	title: string;
	/** The generated article's body, as HTML — WordPress posts are a single WYSIWYG `content` field, not ACF flexible-content blocks. */
	contentHtml: string;
};

/**
 * Creates a new WordPress post as a **draft** — never published automatically.
 * The creator reviews it in wp-admin like any other post (adding a featured
 * image, editing copy, etc.) and publishes it themselves when ready. Once
 * published, it's indistinguishable from a hand-written post to the rest of
 * this codebase: the existing blog pipeline (`getPostContentBySlug`,
 * `translateFields`, comments, reactions, SEO) picks it up with zero changes.
 * @param args See `ICreateVideoArticleDraftArgs`.
 * @returns `{success: true}` once WordPress has accepted the new draft.
 */
export const createVideoArticleDraft = async ({
	videoId,
	title,
	contentHtml,
}: ICreateVideoArticleDraftArgs): Promise<{ success: boolean }> => {
	if (!CMS_URL) throw new Error("CMS_URL not defined.");

	const body: Record<string, unknown> = {
		title,
		slug: buildVideoArticleSlug(videoId),
		content: contentHtml,
		status: "draft",
	};

	if (WP_VIDEO_ARTICLE_CATEGORY_ID) {
		body.categories = [Number(WP_VIDEO_ARTICLE_CATEGORY_ID)];
	}

	const response = await fetch(`${CMS_URL}/wp-json/wp/v2/posts`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...wordpressAuthHeaders() },
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		throw new Error(`WordPress REST API error creating the draft article (${response.status}): ${await response.text()}`);
	}

	return { success: true };
};
