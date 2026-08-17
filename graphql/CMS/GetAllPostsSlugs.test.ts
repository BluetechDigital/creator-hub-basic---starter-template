import { describe, it, expect, afterEach, vi } from "vitest";

const originalEnv = { ...process.env };

const importFreshModule = async () => {
	vi.resetModules();
	return import("./GetAllPostsSlugs");
};

const setCmsEnv = () => {
	process.env.NEXT_PUBLIC_CMS_API_URL = "https://example.test/graphql";
};

describe("getAllPostsSlugs", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("throws when NEXT_PUBLIC_CMS_API_URL is missing", async () => {
		delete process.env.NEXT_PUBLIC_CMS_API_URL;

		await expect(importFreshModule()).rejects.toThrow("NEXT_PUBLIC_CMS_API_URL not defined.");
	});

	it("returns the slug nodes on a successful query", async () => {
		setCmsEnv();

		const nodes = [{ slug: "a-post", modified: "2026-01-01T00:00:00" }];

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ data: { posts: { nodes } } }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getAllPostsSlugs } = await importFreshModule();
		const result = await getAllPostsSlugs();

		expect(result).toEqual(nodes);
	});

	it("returns undefined when the HTTP response is not ok", async () => {
		setCmsEnv();

		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

		const { getAllPostsSlugs } = await importFreshModule();

		expect(await getAllPostsSlugs()).toBeUndefined();
	});

	it("returns undefined when the GraphQL response contains errors", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ errors: [{ message: "Bad query" }] }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getAllPostsSlugs } = await importFreshModule();

		expect(await getAllPostsSlugs()).toBeUndefined();
	});

	it("wraps a thrown fetch error in a generic error", async () => {
		setCmsEnv();

		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

		const { getAllPostsSlugs } = await importFreshModule();

		await expect(getAllPostsSlugs()).rejects.toThrow("Something went wrong trying to fetch all posts slugs");
	});
});
