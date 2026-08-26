'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, KeyboardEvent, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { IPostFilterOptions, ITaxonomyTerm } from "@/graphql/CMS/GetPostFilterOptions";
import * as IPost from "@/graphql/CMS/types/post";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/AllBlogPosts/styles/AllBlogPosts.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX PostFilters Component XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Filter bar for the archive grid: a single-select category dropdown, a tag
 * search box (a native `<input list>` + `<datalist>` combo — no custom dropdown
 * component needed), and a from/to date range. Reads and writes this route's
 * `?tag=&category=&from=&to=` query params directly via
 * `useSearchParams`/`router.replace` rather than local component state, so
 * filtered views stay shareable/bookmarkable and back-button-able — the URL is
 * the only source of truth, matching how `AllBlogPosts.tsx` (a Server
 * Component) resolves the same params server-side for the actual data fetch.
 * `replace` (not `push`) is used so adjusting a filter doesn't fill browser
 * history with one entry per click/keystroke.
 *
 * The tag search box replaced an earlier design that rendered every tag as its
 * own button — fine for a handful of tags, but it doesn't scale: a site with
 * dozens of tags turned this row into a wall of buttons. Selecting a tag
 * (either by picking a `<datalist>` suggestion here, or by clicking a tag pill
 * on a single post — see `PostTaxonomies.tsx` — which lands on this page with
 * `?tag=` already set) shows it as a small removable chip right after the
 * category select instead, so the active row stays exactly as long as the
 * active filters, not the full tag vocabulary.
 *
 * `tag` supports multiple values (comma-separated in the URL, e.g.
 * `?tag=ai,ai-collections`) since `getAllPostsSummaries` maps it onto
 * WPGraphQL's multi-value `tagSlugIn`; `category` is single-select, matching
 * `IPost.IPostFilters`'s doc comment on why category filtering isn't
 * multi-value here.
 * @param categories Every category in use, for the dropdown's options.
 * @param tags Every tag in use, for the search box's suggestions.
 */
const PostFilters: FC<IPostFilterOptions> = ({ categories, tags }) => {

	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [tagSearch, setTagSearch] = useState('');

	// parseTagSlugs/hasActiveFilters (both from `graphql/CMS/types/post.ts`) are
	// the same functions `app/posts/page.tsx` uses to resolve this route's
	// server-side filters — sharing them means this client-side read of the URL
	// can't quietly disagree with the server on what a `?tag=` value means or
	// what counts as "a filter is active", the way two independently
	// hand-rolled copies already had (one trimmed whitespace, the other didn't).
	const activeTags = IPost.parseTagSlugs(searchParams.get('tag'));
	const activeCategory = searchParams.get('category') ?? '';
	const activeFrom = searchParams.get('from') ?? '';
	const activeTo = searchParams.get('to') ?? '';

	const hasActiveFilters = IPost.hasActiveFilters({
		tagSlugs: activeTags,
		categorySlug: activeCategory || undefined,
		dateFrom: activeFrom || undefined,
		dateTo: activeTo || undefined,
	});

	// Resolves the active tag *slugs* (all the URL/`getAllPostsSummaries` care
	// about) back to their display names for the chip row — a tag slug an old
	// bookmarked/shared link points to but that no longer exists in `tags` is
	// simply dropped from the chip row rather than rendering a broken chip.
	const activeTagDetails = activeTags
		.map((slug) => tags.find((tag) => tag.slug === slug))
		.filter((tag): tag is ITaxonomyTerm => Boolean(tag));

	const navigate = (next: URLSearchParams) => {
		const query = next.toString();
		router.replace(query ? `${pathname}?${query}` : pathname);
	};

	// Shared by every filter control (tags, category, from, to) — each one is
	// just "clone the current query string, set-or-delete this one key, then
	// navigate," previously hand-duplicated as two near-identical functions.
	const setQueryParam = (key: string, value: string) => {
		const next = new URLSearchParams(searchParams.toString());

		if (value) {
			next.set(key, value);
		} else {
			next.delete(key);
		}
		navigate(next);
	};

	const setTags = (nextTags: string[]) => setQueryParam('tag', nextTags.join(','));

	const addTag = (slug: string) => {
		if (!activeTags.includes(slug)) {
			setTags([...activeTags, slug]);
		}
		setTagSearch('');
	};

	const removeTag = (slug: string) => setTags(activeTags.filter((tagSlug) => tagSlug !== slug));

	// Matching on every keystroke (this used to run from onChange) looks safe —
	// "an exact name match means the visitor picked a datalist suggestion" — but
	// breaks the moment one tag's full name is a prefix of another's: typing
	// "AI-Collections" character by character passes through the exact text
	// "AI" the instant a shorter "AI" tag exists, auto-adding the wrong tag and
	// clearing the box mid-word. Committing only on blur/Enter instead gives the
	// visitor a chance to keep typing past a coincidental prefix match.
	const commitTagSearch = () => {
		const matched = tags.find((tag) => tag.name.toLowerCase() === tagSearch.toLowerCase());
		if (matched) addTag(matched.slug);
	};

	const handleTagSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key !== 'Enter') return;
		event.preventDefault();
		commitTagSearch();
	};

	const clearFilters = () => router.replace(pathname);

	if (!categories.length && !tags.length) return null;

	return (
		<div className={styles.postFilters}>
			<div className={styles.postFiltersPrimaryRow}>
				{categories.length > 0 && (
					<select
						aria-label="Filter by category"
						className={styles.postFiltersSelect}
						value={activeCategory}
						onChange={(event) => setQueryParam('category', event.target.value)}
					>
						<option value="">All categories</option>
						{categories.map((category) => (
							<option key={category.slug} value={category.slug}>{category.name}</option>
						))}
					</select>
				)}

				{tags.length > 0 && (
					<>
						<input
							type="text"
							list="post-filters-tag-options"
							aria-label="Search tags"
							placeholder="Search tags…"
							className={styles.postFiltersTagSearch}
							value={tagSearch}
							onChange={(event) => setTagSearch(event.target.value)}
							onKeyDown={handleTagSearchKeyDown}
							onBlur={commitTagSearch}
						/>
						<datalist id="post-filters-tag-options">
							{tags
								.filter((tag) => !activeTags.includes(tag.slug))
								.map((tag) => <option key={tag.slug} value={tag.name} />)}
						</datalist>
					</>
				)}

				{activeTagDetails.map((tag) => (
					<span key={tag.slug} className={styles.postFiltersTagChip}>
						{tag.name}
						<button
							type="button"
							aria-label={`Remove ${tag.name} filter`}
							onClick={() => removeTag(tag.slug)}
						>
							&times;
						</button>
					</span>
				))}
			</div>

			<div className={styles.postFiltersDateRange}>
				<label className={styles.postFiltersDateLabel}>
					From
					<input
						type="date"
						value={activeFrom}
						onChange={(event) => setQueryParam('from', event.target.value)}
					/>
				</label>
				<label className={styles.postFiltersDateLabel}>
					To
					<input
						type="date"
						value={activeTo}
						onChange={(event) => setQueryParam('to', event.target.value)}
					/>
				</label>
			</div>

			{hasActiveFilters && (
				<button type="button" className={styles.postFiltersClear} onClick={clearFilters}>
					Clear filters
				</button>
			)}
		</div>
	);
};

PostFilters.displayName = 'PostFilters';

export default PostFilters;
