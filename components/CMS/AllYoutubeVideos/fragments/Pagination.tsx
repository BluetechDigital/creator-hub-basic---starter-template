'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import * as IAllYoutubeVideos from "@/components/CMS/AllYoutubeVideos/types/allYouTubeVideos";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/AllYoutubeVideos/styles/AllYoutubeVideos.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Page Number Helpers XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Builds the visible page-number sequence with `'ellipsis'` markers for gaps
 * — always includes page 1, the last page, and `currentPage - 1` through
 * `currentPage + 1`, collapsing everything else. Standard pagination-UI
 * pattern (first/last/neighbours-of-current, "…" for the rest) rather than
 * ever rendering every single page number for a large catalog.
 * @param currentPage The active page.
 * @param totalPages Total pages in the archive.
 */
const buildPageNumbers = (currentPage: number, totalPages: number): (number | 'ellipsis')[] => {
	const pages = new Set<number>([1, totalPages]);

	for (let page = currentPage - 1; page <= currentPage + 1; page++) {
		if (page >= 1 && page <= totalPages) pages.add(page);
	}

	const sorted = [...pages].sort((a, b) => a - b);
	const result: (number | 'ellipsis')[] = [];
	let previous: number | null = null;

	for (const page of sorted) {
		if (previous !== null && page - previous > 1) {
			result.push('ellipsis');
		}
		result.push(page);
		previous = page;
	}

	return result;
};

/** Page 1 has no `?page=` param at all — a plain `/{locale}/videos` link, not `/{locale}/videos?page=1`. */
const buildPageHref = (locale: string, page: number): string =>
	(page === 1 ? `/${locale}/videos` : `/${locale}/videos?page=${page}`);

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX Pagination Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders the video archive's pagination control — real `<Link>`s to
 * `/videos?page=N`, not client-side state, confirmed with the client so pages
 * are shareable/bookmarkable and survive a refresh or the back button.
 *
 * Page 1 (with more pages available) shows a single "Show more" link to page
 * 2 — the only place "Show more" ever appears, per the confirmed design.
 * Page 2 onward shows full `Previous / 1 … N / Next` numbered pagination
 * instead. Renders nothing at all when there's only one page.
 * Reads the current locale via `useParams()` (not a prop) to build its own
 * links — the standard client-side equivalent to `getLocale()`, which a
 * Client Component can't call itself. Called before the `totalPages <= 1`
 * early return, since React hooks can't follow a conditional return.
 * @param currentPage The active page (already clamped by `AllYoutubeVideos.tsx`).
 * @param totalPages Total pages in the archive.
 * @param dict This locale's `showMore`/`paginationAriaLabel`/`previous`/`next` dictionary strings.
 */
const Pagination: FC<IAllYoutubeVideos.IPagination> = ({ currentPage, totalPages, dict }) => {

	const { locale } = useParams<{ locale: string }>();

	if (totalPages <= 1) return null;

	if (currentPage === 1) {
		return (
			<div className={styles.showMoreWrapper}>
				<Link href={buildPageHref(locale, 2)} className={styles.showMoreButton}>
					{dict.showMore}
				</Link>
			</div>
		);
	}

	const pageNumbers = buildPageNumbers(currentPage, totalPages);

	return (
		<nav aria-label={dict.paginationAriaLabel} className={styles.pagination}>
			{/* currentPage is always > 1 here — currentPage === 1 already returned above. */}
			<Link href={buildPageHref(locale, currentPage - 1)} className={styles.paginationLink}>{dict.previous}</Link>

			{pageNumbers.map((page, index) => (
				page === 'ellipsis' ? (
					<span key={`ellipsis-${index}`} className={styles.paginationEllipsis} aria-hidden="true">&hellip;</span>
				) : (
					<Link
						key={page}
						href={buildPageHref(locale, page)}
						aria-current={page === currentPage ? 'page' : undefined}
						className={page === currentPage ? styles.paginationLinkActive : styles.paginationLink}
					>
						{page}
					</Link>
				)
			))}

			{currentPage < totalPages ? (
				<Link href={buildPageHref(locale, currentPage + 1)} className={styles.paginationLink}>{dict.next}</Link>
			) : (
				<span className={styles.paginationLinkDisabled} aria-disabled="true">{dict.next}</span>
			)}
		</nav>
	);
};

Pagination.displayName = 'Pagination';

export default Pagination;
