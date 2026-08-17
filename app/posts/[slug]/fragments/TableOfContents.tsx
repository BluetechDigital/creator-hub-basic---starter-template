/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC } from "react";
import type { ITocHeading } from "@/components/Global/Elements/ArticleContent/extractToc";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/app/posts/[slug]/styles/SinglePost.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type ITableOfContents = {
	headings: ITocHeading[];
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXX TableOfContents Component XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders the sidebar table of contents from headings extracted by `extractToc` —
 * plain anchor links, no client interactivity needed. Renders nothing when a post has
 * no `<h2>`/`<h3>` headings (e.g. a short post), rather than showing an empty list.
 * @param headings The post's extracted headings, in document order.
 */
const TableOfContents: FC<ITableOfContents> = ({ headings }) => {
	if (headings.length === 0) return null;

	return (
		<>
			<h4 className={styles.tocHeading}>Table Of Contents</h4>
			<ul className={styles.tableOfContents}>
				{headings.map((heading) => (
					<li key={heading.id} className={heading.level === 3 ? styles.tocItemSub : styles.tocItem}>
						<a href={`#${heading.id}`}>{heading.text}</a>
					</li>
				))}
			</ul>
		</>
	);
};

TableOfContents.displayName = 'TableOfContents';

export default TableOfContents;
