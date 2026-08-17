/**
 * Formats a date as a short relative string ("2 days ago", "3 months ago"),
 * matching YouTube's comment-timestamp convention, instead of an absolute
 * date. No new dependency — `dateformat` (already used elsewhere in this app)
 * only formats absolute dates, and the unit-bucketing logic here is small
 * enough not to warrant pulling in `date-fns`/`dayjs` just for this one call
 * site.
 * @param date An ISO-ish date string, as returned by WPGraphQL (parseable by `new Date()`).
 * @returns A short relative-time string, or `"just now"` for anything under a minute old.
 */
export const formatRelativeDate = (date: string): string => {
	const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

	const units: { limit: number; divisor: number; label: string }[] = [
		{ limit: 60, divisor: 1, label: 'second' },
		{ limit: 3600, divisor: 60, label: 'minute' },
		{ limit: 86400, divisor: 3600, label: 'hour' },
		{ limit: 2620800, divisor: 86400, label: 'day' }, // 30.34 days
		{ limit: 31449600, divisor: 2620800, label: 'month' }, // 12 months
		{ limit: Infinity, divisor: 31449600, label: 'year' },
	];

	if (seconds < 60) return 'just now';

	const unit = units.find(({ limit }) => seconds < limit)!;
	const value = Math.floor(seconds / unit.divisor);

	return `${value} ${unit.label}${value === 1 ? '' : 's'} ago`;
};
