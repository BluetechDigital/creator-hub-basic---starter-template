import { describe, it, expect } from "vitest";
import { parseWpDate } from "./parseWpDate";

describe("parseWpDate", () => {
	it("parses a space-separated *Gmt string (comment dates) as UTC", () => {
		expect(parseWpDate('2026-08-18 05:19:28').toISOString()).toBe('2026-08-18T05:19:28.000Z');
	});

	it("parses a T-separated *Gmt string with no zone (post dates) as UTC", () => {
		expect(parseWpDate('2026-08-17T07:16:05').toISOString()).toBe('2026-08-17T07:16:05.000Z');
	});

	it("doesn't double-append a UTC marker onto a string that already has one", () => {
		expect(parseWpDate('2026-08-17T07:16:05Z').toISOString()).toBe('2026-08-17T07:16:05.000Z');
	});

	it("is unaffected by the host's local timezone", () => {
		const originalTz = process.env.TZ;
		// An extreme offset (UTC+14) — if this ever regresses to naively
		// parsing the string as local time, the result would be wildly wrong
		// rather than off by a subtle amount that might pass by coincidence.
		process.env.TZ = 'Pacific/Kiritimati';

		try {
			expect(parseWpDate('2026-08-18 05:19:28').toISOString()).toBe('2026-08-18T05:19:28.000Z');
		} finally {
			process.env.TZ = originalTz;
		}
	});
});
