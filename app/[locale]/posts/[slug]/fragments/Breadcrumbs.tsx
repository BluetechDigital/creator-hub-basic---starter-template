/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import Link from "next/link";
import { getLocale } from "@/i18n/getLocale";
import { getDictionary } from "@/i18n/dictionaries";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/app/[locale]/posts/[slug]/styles/SinglePost.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IBreadcrumbs = {
	postTitle: string;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXX ChevronSeparator Component XXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/** The shuffle.dev "Breadcrumbs from FilyTreck" template's right-chevron, reused between each non-final crumb. */
const ChevronSeparator = () => (
	<svg width="12" height="13" viewBox="0 0 12 13" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
		<path d="M6.51348 2.21443C6.4457 2.28417 6.39189 2.36715 6.35518 2.45857C6.31846 2.54999 6.29956 2.64804 6.29956 2.74708C6.29956 2.84612 6.31846 2.94418 6.35518 3.0356C6.39189 3.12702 6.4457 3.20999 6.51348 3.27973L8.89286 5.74793L1.66071 5.74793C1.46891 5.74793 1.28495 5.82697 1.14932 5.96766C1.0137 6.10835 0.9375 6.29917 0.9375 6.49814C0.9375 6.69711 1.0137 6.88793 1.14932 7.02862C1.28495 7.16931 1.46891 7.24835 1.66071 7.24835L8.89286 7.24835L6.51348 9.71654C6.4457 9.78629 6.39189 9.86926 6.35518 9.96068C6.31846 10.0521 6.29956 10.1502 6.29956 10.2492C6.29956 10.3482 6.31846 10.4463 6.35518 10.5377C6.39189 10.6291 6.4457 10.7121 6.51348 10.7818C6.64899 10.9216 6.83228 11 7.02335 11C7.21441 11 7.39771 10.9216 7.53321 10.7818L10.6358 7.55594C10.9074 7.27584 11.0609 6.89543 11.0625 6.49814C11.059 6.10345 10.9057 5.72609 10.6358 5.44784L7.53321 2.22193C7.39867 2.0812 7.2159 2.00142 7.02484 2.00002C6.83378 1.99861 6.64994 2.0757 6.51348 2.21443Z" fill="currentColor" />
	</svg>
);

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX Breadcrumbs Component XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders the single-post page's breadcrumb trail (Home → Posts → the post's
 * own title), above `PostHero`. Adapted from a pasted shuffle.dev "Breadcrumbs
 * from FilyTreck" template — same pill shape and chevron separators, restyled
 * onto this site's own tokens (the template's purple/white pair doesn't exist
 * here) and with the placeholder trail replaced by this page's real one.
 * "Posts" (not "Blog"/"Blogs") matches `pageType.posts`'s WP page title, the
 * same label `buildBreadcrumbListSchema`'s JSON-LD breadcrumb data already
 * uses for this page — this is the visible counterpart to that structured
 * data, not a second, independent source of truth for the trail.
 *
 * Uses a semantic `<nav aria-label="Breadcrumb"><ol>` rather than the
 * template's plain `<ul>` of links, and marks the current page with
 * `aria-current="page"` instead of a link — the standard accessible
 * breadcrumb pattern, since a breadcrumb's last item represents where the
 * visitor already is, not another place to navigate to.
 * Async Server Component — reads the current locale directly (`getLocale()`)
 * to build locale-prefixed hrefs and load its own dictionary strings, rather
 * than receiving either as a prop.
 * @param postTitle The current post's title, shown as the trail's final, non-linked crumb.
 */
const Breadcrumbs = async ({ postTitle }: IBreadcrumbs) => {
	const locale = await getLocale();
	const dict = await getDictionary(locale);

	return (
		<nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
			<ol className={styles.breadcrumbsList}>
				<li className={styles.breadcrumbItem}>
					<Link href={`/${locale}`}>{dict.breadcrumbs.home}</Link>
					<ChevronSeparator />
				</li>
				<li className={styles.breadcrumbItem}>
					<Link href={`/${locale}/posts`}>{dict.breadcrumbs.posts}</Link>
					<ChevronSeparator />
				</li>
				<li className={styles.breadcrumbItem} aria-current="page">
					<span className={styles.breadcrumbCurrent}>{postTitle}</span>
				</li>
			</ol>
		</nav>
	);
};

Breadcrumbs.displayName = 'Breadcrumbs';

export default Breadcrumbs;
