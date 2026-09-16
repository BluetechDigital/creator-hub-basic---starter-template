import { describe, it, expect, afterEach, vi } from "vitest";

const originalEnv = { ...process.env };

const importFreshModule = async () => {
	vi.resetModules();
	return import("./GetVideoArticleLink");
};

const setCmsEnv = () => {
	process.env.NEXT_PUBLIC_CMS_API_URL = "https://example.test/graphql";
};

describe("getVideoArticleLink", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("throws at import time when NEXT_PUBLIC_CMS_API_URL is missing", async () => {
		delete process.env.NEXT_PUBLIC_CMS_API_URL;
		await expect(importFreshModule()).rejects.toThrow("NEXT_PUBLIC_CMS_API_URL not defined.");
	});

	it("queries by the deterministic video-article slug", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ data: { posts: { edges: [] } } }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getVideoArticleLink } = await importFreshModule();
		await getVideoArticleLink("RQlRGCrzCEY");

		const [, requestInit] = mockFetch.mock.calls[0];
		const body = JSON.parse((requestInit as RequestInit).body as string);
		expect(body.variables).toEqual({ slug: "video-article-RQlRGCrzCEY" });
	});

	it("returns the article's title/slug when a published post matches", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				data: { posts: { edges: [{ node: { title: "A Great Article", slug: "video-article-RQlRGCrzCEY" } }] } },
			}),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getVideoArticleLink } = await importFreshModule();
		expect(await getVideoArticleLink("RQlRGCrzCEY")).toEqual({
			title: "A Great Article",
			slug: "video-article-RQlRGCrzCEY",
		});
	});

	it("returns undefined when no published post matches (still a draft, or none generated)", async () => {
		setCmsEnv();

		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { posts: { edges: [] } } }) }));

		const { getVideoArticleLink } = await importFreshModule();
		expect(await getVideoArticleLink("RQlRGCrzCEY")).toBeUndefined();
	});

	it("returns undefined (not a throw) when the HTTP response is not ok", async () => {
		setCmsEnv();
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

		const { getVideoArticleLink } = await importFreshModule();
		expect(await getVideoArticleLink("RQlRGCrzCEY")).toBeUndefined();
	});

	it("returns undefined (not a throw) when the GraphQL response contains errors", async () => {
		setCmsEnv();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({ ok: true, json: async () => ({ errors: [{ message: "Bad query" }] }) }),
		);

		const { getVideoArticleLink } = await importFreshModule();
		expect(await getVideoArticleLink("RQlRGCrzCEY")).toBeUndefined();
	});

	it("returns undefined (not a throw) on a network-level failure", async () => {
		setCmsEnv();
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

		const { getVideoArticleLink } = await importFreshModule();
		expect(await getVideoArticleLink("RQlRGCrzCEY")).toBeUndefined();
	});
});
