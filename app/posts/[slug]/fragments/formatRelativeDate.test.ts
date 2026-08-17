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
});
