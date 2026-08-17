/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import DOMPurify from "isomorphic-dompurify";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Types XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export type ITocHeading = {
	id: string;
	text: string;
	level: 2 | 3;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Slug Helper XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const slugify = (text: string): string =>
	text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "") || "section";

const HEADING_REGEX = /<(h2|h3)\b[^>]*>([\s\S]*?)<\/\1>/gi;
const STRIP_TAGS_REGEX = /<[^>]+>/g;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX extractToc XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Sanitizes a post's WYSIWYG body and extracts a table of contents from its real
 * `<h2>`/`<h3>` headings, in document order — no synthetic "Introduction"/"Summary"
 * bookend entries, since arbitrary CMS content has no such structure to draw from.
 * Also injects a matching `id` into each heading's opening tag in the returned HTML,
 * so this single pass is the one source of truth for both the table of contents'
 * anchor targets and the `id`s that actually exist in the rendered body — there's no
 * second, independent slugify pass that could drift out of sync with this one.
 * Duplicate heading text gets a `-2`, `-3`, ... suffix in encounter order so anchors
 * stay unique. A post with no headings returns an empty `headings` array.
 * @param rawContent The post's raw WYSIWYG HTML body, as returned by `getPostContentBySlug`.
 * @returns The extracted headings (for a `TableOfContents` sidebar) and the sanitized
 * HTML with heading `id`s injected (to pass into `ArticleContent`).
 */
export const extractToc = (rawContent: string): { headings: ITocHeading[]; contentWithAnchors: string } => {
	const clean = DOMPurify.sanitize(rawContent);

	const headings: ITocHeading[] = [];
	const seenSlugs = new Map<string, number>();

	const contentWithAnchors = clean.replace(HEADING_REGEX, (fullMatch, tag: string, innerHtml: string) => {
		const text = innerHtml.replace(STRIP_TAGS_REGEX, "").trim();

		if (!text) return fullMatch;

		const baseSlug = slugify(text);
		const seenCount = seenSlugs.get(baseSlug) ?? 0;
		seenSlugs.set(baseSlug, seenCount + 1);
		const id = seenCount === 0 ? baseSlug : `${baseSlug}-${seenCount + 1}`;

		headings.push({ id, text, level: tag.toLowerCase() === "h2" ? 2 : 3 });

		return fullMatch.replace(`<${tag}`, `<${tag} id="${id}"`);
	});

	return { headings, contentWithAnchors };
};
