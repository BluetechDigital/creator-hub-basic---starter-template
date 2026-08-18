/**
 * Normalizes a WPGraphQL `*Gmt` datetime string ("2026-08-18 05:19:28" — a
 * space instead of "T", no UTC marker) into a `Date` that's actually parsed
 * as UTC. Without this, `new Date(wpDateGmt)` silently treats the string as
 * local time in whichever timezone happens to run the code (the visitor's
 * browser, or the server during SSR) — confirmed live: a reply posted
 * seconds earlier showed as "3 hours ago" because the GMT string got
 * misread as local time, shifting the computed age by the visitor's UTC
 * offset. Must be fed a `*Gmt` field specifically, not WPGraphQL's plain
 * `date` field (site-local time) — using `date` here would just move the
 * same bug rather than fix it.
 * @param wpDateGmt A WPGraphQL `*Gmt` field's raw string value.
 */
const toUtcDate = (wpDateGmt: string): Date => {
	const isoLike = wpDateGmt.includes('T') ? wpDateGmt : wpDateGmt.replace(' ', 'T');
	const hasTimezone = /[Zz]|[+-]\d{2}:?\d{2}$/.test(isoLike);
	return new Date(hasTimezone ? isoLike : `${isoLike}Z`);
};

/**
 * Formats a date as a short relative string ("2 days ago", "3 months ago"),
 * matching YouTube's comment-timestamp convention, instead of an absolute
 * date. No new dependency — `dateformat` (already used elsewhere in this app)
 * only formats absolute dates, and the unit-bucketing logic here is small
 * enough not to warrant pulling in `date-fns`/`dayjs` just for this one call
 * site.
 * @param dateGmt A WPGraphQL `*Gmt` datetime field's value (UTC, regardless of
 * the WordPress site's local timezone setting) — see `toUtcDate`'s doc
 * comment for why it must be the GMT variant specifically.
 * @returns A short relative-time string, or `"just now"` for anything under a minute old.
 */
export const formatRelativeDate = (dateGmt: string): string => {
	const seconds = Math.floor((Date.now() - toUtcDate(dateGmt).getTime()) / 1000);

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
