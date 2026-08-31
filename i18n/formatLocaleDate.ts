/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Format Locale Date XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Formats a `Date` using each locale's own natural date convention, via the
 * native `Intl.DateTimeFormat` — not the `dateformat` package's `i18n.dayNames`/
 * `i18n.monthNames` override, which this codebase used to reach for elsewhere
 * (`PostHero.tsx`, `VideoHero.tsx`, the post/video card components). That
 * override lives on a single shared, mutable module-level object, not a
 * per-call argument — unsafe under Next's concurrent server process, where
 * one visitor's request could overwrite the day/month names mid-flight for a
 * different visitor's concurrently-rendering request in another locale.
 * `Intl.DateTimeFormat` takes the locale per call instead, so there's no
 * shared state to race on. Dependency-free and safe to import directly from
 * Client Components too — `Intl` is a JS runtime global, not a `server-only` API.
 *
 * Deliberately drops the English-specific ordinal day suffix ("17th") the
 * previous `dateformat`-based calls used (`"mmmm dS, yyyy"`/`"dddd, mmmm dS,
 * yyyy"`) — that's an English convention, not a universal one (French reads
 * "17 août", German "17. August", Spanish "17 de agosto", not an English-style
 * ordinal transliterated into another language). Each locale's own natural
 * `Intl` output is used instead, which is what every other translated string
 * in this app already does — no ordinal-suffix translation table needed.
 * @param date The date to format.
 * @param locale One of this project's supported locale codes.
 * @param withWeekday Include the full weekday name (`Monday, ...`) — used by
 * the single-post/single-video hero headers; the archive card dates omit it.
 */
export const formatLocaleDate = (date: Date, locale: string, withWeekday: boolean = false): string =>
    new Intl.DateTimeFormat(locale, {
        ...(withWeekday ? { weekday: "long" } : {}),
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(date);
