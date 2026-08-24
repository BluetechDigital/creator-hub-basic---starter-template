import { describe, it, expect, afterEach, vi } from "vitest";

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
