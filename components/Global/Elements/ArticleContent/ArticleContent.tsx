/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { CSSProperties, FC } from "react";
import Image from "next/image";
import DOMPurify from "isomorphic-dompurify";
import parse, { Element, HTMLReactParserOptions } from "html-react-parser";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/Global/Elements/ArticleContent/styles/ArticleContent.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IArticleContent = {
	content: string;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Helpers XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Fallback intrinsic size for CMS images that ship no width/height (a
// `size-full` image block does this). Only used as `next/image`'s aspect-ratio
// hint — the on-screen size is CSS-driven.
const FALLBACK_WIDTH = 1200;
const FALLBACK_HEIGHT = 800;

// Accepts an absolute http(s) URL (an external image a CMS editor pasted in
// directly) as well as a root-relative path — the shape every CMS-origin
// image arrives in by the time it gets here, already rewritten to
// `/api/media/...` by `getPostContentBySlug` before `content` is ever passed
// down (see `config/cmsMediaUrl.ts`). Excludes `data:`/`blob:` URIs, which
// `next/image` can't optimize.
const isRenderableImageSrc = (value: string): boolean => /^(https?:\/\/|\/)/i.test(value);

/** Parses an inline `style="a:b;c:d"` string into a React style object so the
 * CMS's per-image `aspect-ratio` / `object-fit` crop survives the swap to
 * `next/image`. */
const parseStyleString = (value?: string): CSSProperties => {
	if (!value) return {};

	return value.split(";").reduce<Record<string, string>>((style, declaration) => {
		const [property, ...rest] = declaration.split(":");
		const propertyValue = rest.join(":").trim();
		if (property.trim() && propertyValue) {
			const camelCased = property.trim().replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
			style[camelCased] = propertyValue;
		}
		return style;
	}, {}) as CSSProperties;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX HTML → React transform XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const parserOptions: HTMLReactParserOptions = {
	replace: (node) => {
		if (!(node instanceof Element)) return undefined;

		// WordPress's image "lightbox" trigger button needs the WP Interactivity
		// API JS, which a headless frontend never loads — it's a dead button.
		if (node.name === "button" && (node.attribs.class ?? "").includes("lightbox-trigger")) {
			return <></>;
		}

		// Route content images through `next/image`: proxied via the app's own
		// origin (so an ad-blocker or a CDN geo-restriction on the CMS host can't
		// break them for real visitors) and served as AVIF/WebP. By the time
		// `content` reaches this component `src` is already `/api/media/...`,
		// not the real CMS host — `getPostContentBySlug` rewrites every
		// CMS-origin `src`/`href` in the raw HTML before returning it (see
		// `config/cmsMediaUrl.ts`), so the CMS's real hostname never actually
		// reaches the browser, not just the image bytes. The CMS's inline crop
		// style is preserved.
		if (node.name === "img" && node.attribs.src && isRenderableImageSrc(node.attribs.src)) {
			const width = Number(node.attribs.width) || FALLBACK_WIDTH;
			const height = Number(node.attribs.height) || FALLBACK_HEIGHT;

			return (
				<Image
					src={node.attribs.src}
					alt={node.attribs.alt ?? ""}
					width={width}
					height={height}
					className={node.attribs.class || undefined}
					sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
					style={{ ...parseStyleString(node.attribs.style), width: "100%", height: "auto" }}
				/>
			);
		}

		return undefined;
	},
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXX ArticleContent Component XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders a full CMS-authored blog post body. Sanitizes the WYSIWYG HTML with
 * DOMPurify — safe to call directly here rather than behind `useMemo` the way
 * `Paragraph.tsx` does, since `isomorphic-dompurify` runs via a bundled `jsdom` and
 * this is a plain Server Component that renders once per request, not a client
 * component re-rendering on state changes. Parses the sanitized string into React
 * elements with `html-react-parser` — the `replace` transform swaps every
 * `<img>` for `next/image` (see its doc comment) and drops WordPress's
 * headless-dead lightbox buttons.
 *
 * Deliberately not `Paragraph` here — `Paragraph` is a `'use client'` component
 * built around `framer-motion`'s `useScroll` for a scroll-fade effect this
 * full-body use case has no need for.
 * @param content The post's raw WYSIWYG HTML body, sanitized on render.
 */
const ArticleContent: FC<IArticleContent> = ({ content }) => {
	const clean = DOMPurify.sanitize(content);

	return <div className={styles.articleContent}>{parse(clean, parserOptions)}</div>;
};

ArticleContent.displayName = 'ArticleContent';

export default ArticleContent;
