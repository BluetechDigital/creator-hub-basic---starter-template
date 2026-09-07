/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import "server-only";
import DOMPurify from "isomorphic-dompurify";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX Comment HTML Sanitizer XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Reader comments are auto-approved on this site, so their HTML is fully
 * untrusted user input rendered via `dangerouslySetInnerHTML`. WordPress's
 * `kses` and the client-side `DOMPurify` in `CommentsFeed.tsx` are both fine
 * as far as they go, but the authoritative pass belongs here — server-side,
 * before the raw HTML ever enters the RSC payload — with a deliberately tiny
 * allowlist:
 *
 *  - only inline emphasis, lists, blockquotes and code blocks survive;
 *  - **links are stripped to their text** (`a` is not allowed) — an
 *    auto-approved reader link is a phishing vector not worth the feature;
 *  - `style`, `script`, `iframe`, `img`, `form`, `svg`, `math` and every
 *    event-handler attribute are removed outright.
 *
 * Anything outside the allowlist is dropped, not escaped, so a comment that
 * was pure markup renders as empty rather than as visible angle brackets.
 * @param html The raw comment `content` HTML from WPGraphQL.
 * @returns Sanitized HTML safe to pass to `dangerouslySetInnerHTML`.
 */
export const sanitizeCommentHtml = (html: string | null | undefined): string =>
	DOMPurify.sanitize(html ?? "", {
		ALLOWED_TAGS: [
			"p", "br", "b", "strong", "i", "em", "u", "s",
			"blockquote", "ul", "ol", "li", "code", "pre",
		],
		ALLOWED_ATTR: [],
		ALLOW_DATA_ATTR: false,
		ALLOW_ARIA_ATTR: false,
	});
