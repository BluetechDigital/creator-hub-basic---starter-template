import { describe, it, expect, afterEach, vi } from "vitest";

// unstable_cache requires Next's request-scoped incremental-cache context,
// which doesn't exist outside a real Next.js server runtime — calling the
// real implementation here throws "Invariant: incrementalCache missing"
// (confirmed directly). Mocked as a pass-through so these tests exercise the
// underlying fetch/error-handling logic exactly as before caching was added,
// without needing a real Next.js request context.
vi.mock("next/cache", () => ({
	unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

const originalEnv = { ...process.env };

const importFreshModule = async () => {
	vi.resetModules();
	return import("./GetPostFilterOptions");
};

const setCmsEnv = () => {
	process.env.NEXT_PUBLIC_CMS_API_URL = "https://example.test/graphql";
};

describe("getPostFilterOptions", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("throws when NEXT_PUBLIC_CMS_API_URL is missing", async () => {
		delete process.env.NEXT_PUBLIC_CMS_API_URL;

		await expect(importFreshModule()).rejects.toThrow("NEXT_PUBLIC_CMS_API_URL not defined.");
	});

	it("returns categories and tags on success", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				data: {
					categories: { nodes: [{ name: "Uncategorized", slug: "uncategorized" }] },
					tags: { nodes: [{ name: "AI", slug: "ai" }] },
				},
			}),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getPostFilterOptions } = await importFreshModule();

		expect(await getPostFilterOptions()).toEqual({
			categories: [{ name: "Uncategorized", slug: "uncategorized" }],
			tags: [{ name: "AI", slug: "ai" }],
		});
	});

	it("returns undefined when the HTTP response is not ok", async () => {
		setCmsEnv();

		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

		const { getPostFilterOptions } = await importFreshModule();

		expect(await getPostFilterOptions()).toBeUndefined();
	});

	it("returns undefined when the GraphQL response contains errors", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ errors: [{ message: "Bad query" }] }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getPostFilterOptions } = await importFreshModule();

		expect(await getPostFilterOptions()).toBeUndefined();
	});

	it("returns undefined (not a throw) on a network-level failure", async () => {
		setCmsEnv();

		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

		const { getPostFilterOptions } = await importFreshModule();

		await expect(getPostFilterOptions()).resolves.toBeUndefined();
	});
});
