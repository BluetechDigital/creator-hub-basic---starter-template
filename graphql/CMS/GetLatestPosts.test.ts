import { describe, it, expect, afterEach, vi } from "vitest";

const originalEnv = { ...process.env };

const importFreshModule = async () => {
	vi.resetModules();
	return import("./GetLatestPosts");
};

const setCmsEnv = () => {
	process.env.NEXT_PUBLIC_CMS_API_URL = "https://example.test/graphql";
};

describe("getLatestPosts", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("throws when NEXT_PUBLIC_CMS_API_URL is missing", async () => {
		delete process.env.NEXT_PUBLIC_CMS_API_URL;

		await expect(importFreshModule()).rejects.toThrow("NEXT_PUBLIC_CMS_API_URL not defined.");
	});

	it("returns post summaries on a successful query", async () => {
		setCmsEnv();

		const summary = {
			title: "Another Post",
			slug: "another-post",
			date: "2026-01-05T00:00:00",
			excerpt: "<p>Excerpt</p>",
			featuredImage: null,
			categories: { nodes: [{ name: "News", slug: "news" }] },
			seo: { readingTime: 3 },
		};

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ data: { posts: { nodes: [summary] } } }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getLatestPosts } = await importFreshModule();
		const result = await getLatestPosts(307, 3);

		expect(result).toEqual([summary]);
	});

	it("sends first/excludeId as GraphQL variables rather than interpolating them into the query string", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ data: { posts: { nodes: [] } } }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getLatestPosts } = await importFreshModule();
		await getLatestPosts(307, 3);

		const [, requestInit] = mockFetch.mock.calls[0];
		const body = JSON.parse((requestInit as RequestInit).body as string);

		expect(body.variables).toEqual({ first: 3, excludeId: 307 });
		expect(body.query).not.toContain("307");
	});

	it("returns undefined when the HTTP response is not ok", async () => {
		setCmsEnv();

		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

		const { getLatestPosts } = await importFreshModule();

		expect(await getLatestPosts(307)).toBeUndefined();
	});

	it("returns undefined when the GraphQL response contains errors", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ errors: [{ message: "Bad query" }] }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getLatestPosts } = await importFreshModule();

		expect(await getLatestPosts(307)).toBeUndefined();
	});

	it("wraps a thrown fetch error in a generic error", async () => {
		setCmsEnv();

		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

		const { getLatestPosts } = await importFreshModule();

		await expect(getLatestPosts(307)).rejects.toThrow(
			"Something went wrong trying to fetch the latest posts",
		);
	});
});
