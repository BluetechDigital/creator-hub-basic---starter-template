import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { headerStore } = vi.hoisted(() => ({
	headerStore: { value: new Map<string, string>() },
}));

vi.mock("next/headers", () => ({
	headers: async () => headerStore.value,
}));

const importFresh = async () => {
	vi.resetModules();
	return import("./rateLimit");
};

describe("checkRateLimit", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("allows requests up to the limit, then rejects", async () => {
		const { checkRateLimit } = await importFresh();

		expect(checkRateLimit("k", 3, 1000)).toBe(true);
		expect(checkRateLimit("k", 3, 1000)).toBe(true);
		expect(checkRateLimit("k", 3, 1000)).toBe(true);
		expect(checkRateLimit("k", 3, 1000)).toBe(false);
	});

	it("resets after the window elapses", async () => {
		const { checkRateLimit } = await importFresh();

		expect(checkRateLimit("k", 1, 1000)).toBe(true);
		expect(checkRateLimit("k", 1, 1000)).toBe(false);

		vi.advanceTimersByTime(1001);

		expect(checkRateLimit("k", 1, 1000)).toBe(true);
	});

	it("tracks each key independently", async () => {
		const { checkRateLimit } = await importFresh();

		expect(checkRateLimit("a", 1, 1000)).toBe(true);
		expect(checkRateLimit("b", 1, 1000)).toBe(true);
		expect(checkRateLimit("a", 1, 1000)).toBe(false);
	});
});

describe("getRequestIp", () => {
	afterEach(() => {
		headerStore.value = new Map();
	});

	it("reads the first entry of x-forwarded-for", async () => {
		headerStore.value = new Map([["x-forwarded-for", "203.0.113.9, 70.41.3.18"]]);
		const { getRequestIp } = await importFresh();

		expect(await getRequestIp()).toBe("203.0.113.9");
	});

	it("falls back to x-real-ip", async () => {
		headerStore.value = new Map([["x-real-ip", "198.51.100.7"]]);
		const { getRequestIp } = await importFresh();

		expect(await getRequestIp()).toBe("198.51.100.7");
	});

	it("returns a constant when no IP header is present", async () => {
		headerStore.value = new Map();
		const { getRequestIp } = await importFresh();

		expect(await getRequestIp()).toBe("unknown");
	});
});
