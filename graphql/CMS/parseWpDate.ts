/**
 * Parses a WPGraphQL `*Gmt` datetime field's raw string ("2026-08-18
 * 05:19:28" or "2026-08-17T07:16:05" — inconsistent separator depending on
 * the field/endpoint, but always missing a UTC marker) into a `Date` that's
 * actually treated as UTC.
 *
 * Without this, `new Date(wpDateGmt)` gets silently parsed as local time in
 * whichever timezone happens to run the code (the visitor's browser, or the
 * server during SSR) instead of UTC — confirmed live on a comment date: a
 * reply posted moments earlier showed as several hours old because its GMT
 * string got misread as local time, shifting the computed age by the
 * visitor's UTC offset. The same bug applies to any other WPGraphQL date
 * field parsed this way.
 *
 * Must be fed a `*Gmt` field specifically (`dateGmt`, `modifiedGmt`, …), not
 * WPGraphQL's plain `date`/`modified` fields (site-local time, per the
 * WordPress site's own Settings → General timezone) — using the site-local
 * field here would just move the same bug rather than fix it, since it's
 * only guaranteed to equal UTC if the site happens to be configured to
 * UTC+0.
 * @param wpDateGmt A WPGraphQL `*Gmt` field's raw string value.
 */
export const parseWpDate = (wpDateGmt: string): Date => {
	const isoLike = wpDateGmt.includes('T') ? wpDateGmt : wpDateGmt.replace(' ', 'T');
	const hasTimezone = /[Zz]|[+-]\d{2}:?\d{2}$/.test(isoLike);
	return new Date(hasTimezone ? isoLike : `${isoLike}Z`);
};
