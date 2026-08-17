/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC } from "react";
import parse from "html-react-parser";
import DOMPurify from "isomorphic-dompurify";

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
XXXXXXXXXXXXXXXXXXXXXXXXXX ArticleContent Component XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders a full CMS-authored blog post body. Sanitizes the WYSIWYG HTML with
 * DOMPurify — safe to call directly here rather than behind `useMemo` the way
 * `Paragraph.tsx` does, since `isomorphic-dompurify` runs via a bundled `jsdom` and
 * this is a plain Server Component that renders once per request, not a client
 * component re-rendering on state changes. Parses the sanitized string into React
 * elements with `html-react-parser` rather than `dangerouslySetInnerHTML`, since a
 * full article body is the intended use case for that dependency. Deliberately not
 * `Paragraph` here — `Paragraph` is a `'use client'` component built around
 * `framer-motion`'s `useScroll` for a scroll-fade effect this full-body use case has
 * no need for.
 * @param content The post's raw WYSIWYG HTML body, sanitized on render.
 */
const ArticleContent: FC<IArticleContent> = ({ content }) => {
	const clean = DOMPurify.sanitize(content);

	return <div className={styles.articleContent}>{parse(clean)}</div>;
};

ArticleContent.displayName = 'ArticleContent';

export default ArticleContent;
