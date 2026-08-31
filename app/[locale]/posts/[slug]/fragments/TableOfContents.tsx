/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import type { ITocHeading } from "@/components/Global/Elements/ArticleContent/extractToc";
import { getLocale } from "@/i18n/getLocale";
import { getDictionary } from "@/i18n/dictionaries";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/app/[locale]/posts/[slug]/styles/SinglePost.module.css";

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
 * Async Server Component — reads the current locale directly (`getLocale()`) for its
 * own "Table Of Contents" heading, same self-fetching pattern as `PostTaxonomies.tsx`.
 * @param headings The post's extracted headings, in document order.
 */
const TableOfContents = async ({ headings }: ITableOfContents) => {
	if (headings.length === 0) return null;

	const locale = await getLocale();
	const dict = await getDictionary(locale);

	return (
		<>
			<h4 className={styles.tocHeading}>{dict.singlePost.tableOfContents}</h4>
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
