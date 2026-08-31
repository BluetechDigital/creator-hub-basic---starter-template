import { describe, it, expect } from "vitest";
import { formatLocaleDate } from "@/i18n/formatLocaleDate";

const DATE = new Date("2026-08-17T07:16:05Z");

describe("formatLocaleDate", () => {
	it("formats an English date without a weekday by default", () => {
		expect(formatLocaleDate(DATE, "en")).toBe("August 17, 2026");
	});

	it("includes the weekday when withWeekday is true", () => {
		expect(formatLocaleDate(DATE, "en", true)).toBe("Monday, August 17, 2026");
	});

	it("uses each locale's own natural date convention, not an English-style ordinal suffix", () => {
		expect(formatLocaleDate(DATE, "fr")).toBe("17 août 2026");
		expect(formatLocaleDate(DATE, "de")).toBe("17. August 2026");
		expect(formatLocaleDate(DATE, "es")).toBe("17 de agosto de 2026");
		expect(formatLocaleDate(DATE, "it")).toBe("17 agosto 2026");
		expect(formatLocaleDate(DATE, "pt")).toBe("17 de agosto de 2026");
	});

	it("includes the weekday per locale when withWeekday is true", () => {
		expect(formatLocaleDate(DATE, "fr", true)).toBe("lundi 17 août 2026");
		expect(formatLocaleDate(DATE, "de", true)).toBe("Montag, 17. August 2026");
	});
});
