import { parseWpDate } from "@/graphql/CMS/parseWpDate";

/**
 * Formats a date as a short relative string ("2 days ago", "3 months ago"),
 * matching YouTube's comment-timestamp convention, instead of an absolute
 * date. Locale-aware via the native `Intl.RelativeTimeFormat` (`numeric:
 * "always"` — always "1 day ago", never "yesterday" — matches this
 * convention's original, purely-numeric English behavior instead of
 * introducing new idioms per locale). No new dependency, same reasoning as
 * before: the unit-bucketing logic here is small enough not to warrant
 * pulling in `date-fns`/`dayjs` just for this one call site — only the
 * final formatting step changed, from hand-rolled English string
 * concatenation to `Intl`.
 * @param dateGmt A WPGraphQL `*Gmt` datetime field's value (UTC, regardless of
 * the WordPress site's local timezone setting) — see `parseWpDate`'s doc
 * comment for why it must be the GMT variant specifically.
 * @param locale One of this project's supported locale codes.
 * @param justNowLabel The already-translated "just now" string
 * (`dict.singlePost.justNow`) — `Intl.RelativeTimeFormat` has no equivalent
 * for "under a minute old", so that one case is still handled here directly.
 * @returns A short, locale-formatted relative-time string, or `justNowLabel`
 * for anything under a minute old.
 */
export const formatRelativeDate = (dateGmt: string, locale: string, justNowLabel: string): string => {
	const seconds = Math.floor((Date.now() - parseWpDate(dateGmt).getTime()) / 1000);

	if (seconds < 60) return justNowLabel;

	const units: { limit: number; divisor: number; unit: Intl.RelativeTimeFormatUnit }[] = [
		{ limit: 3600, divisor: 60, unit: 'minute' },
		{ limit: 86400, divisor: 3600, unit: 'hour' },
		{ limit: 2620800, divisor: 86400, unit: 'day' }, // 30.34 days
		{ limit: 31449600, divisor: 2620800, unit: 'month' }, // 12 months
		{ limit: Infinity, divisor: 31449600, unit: 'year' },
	];

	const { divisor, unit } = units.find(({ limit }) => seconds < limit)!;
	const value = Math.floor(seconds / divisor);

	return new Intl.RelativeTimeFormat(locale, { numeric: 'always' }).format(-value, unit);
};
