import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { formatRelativeDate } from "./formatRelativeDate";

const NOW = new Date("2026-08-17T12:00:00Z");

describe("formatRelativeDate", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(NOW);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns 'just now' for anything under a minute old", () => {
		expect(formatRelativeDate(new Date(NOW.getTime() - 30 * 1000).toISOString())).toBe('just now');
	});

	it("formats minutes", () => {
		expect(formatRelativeDate(new Date(NOW.getTime() - 5 * 60 * 1000).toISOString())).toBe('5 minutes ago');
	});

	it("uses the singular unit for a value of 1", () => {
		expect(formatRelativeDate(new Date(NOW.getTime() - 60 * 60 * 1000).toISOString())).toBe('1 hour ago');
	});

	it("formats hours", () => {
		expect(formatRelativeDate(new Date(NOW.getTime() - 3 * 60 * 60 * 1000).toISOString())).toBe('3 hours ago');
	});

	it("formats days", () => {
		expect(formatRelativeDate(new Date(NOW.getTime() - 2 * 86400 * 1000).toISOString())).toBe('2 days ago');
	});

	it("formats months", () => {
		expect(formatRelativeDate(new Date(NOW.getTime() - 90 * 86400 * 1000).toISOString())).toBe('2 months ago');
	});

	it("formats years", () => {
		expect(formatRelativeDate(new Date(NOW.getTime() - 400 * 86400 * 1000).toISOString())).toBe('1 year ago');
	});

	it("treats a WordPress *Gmt string (space-separated, no timezone marker) as UTC, regardless of the host's local timezone", () => {
		const originalTz = process.env.TZ;
		// An extreme offset (UTC+14) — if this ever regresses to naively
		// parsing the string as local time, the result would be wildly wrong
		// rather than off by a subtle amount that might pass by coincidence.
		process.env.TZ = 'Pacific/Kiritimati';

		try {
			// 5 minutes before the fixed "NOW" (2026-08-17T12:00:00Z), in
			// WordPress's actual dateGmt shape: a space instead of "T", no "Z".
			expect(formatRelativeDate('2026-08-17 11:55:00')).toBe('5 minutes ago');
		} finally {
			process.env.TZ = originalTz;
		}
	});

	it("doesn't double-append a UTC marker onto a string that already has one", () => {
		expect(formatRelativeDate('2026-08-17T11:55:00Z')).toBe('5 minutes ago');
	});
});
