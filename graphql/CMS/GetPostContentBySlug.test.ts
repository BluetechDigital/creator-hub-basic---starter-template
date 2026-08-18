import { describe, it, expect, afterEach, vi } from "vitest";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Why the dynamic import XXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_CMS_API_URL is read into a module-scope const on import (throwing if
missing), not re-read per call — same shape as GetAllYoutubeContent.ts. Each test
sets process.env before importing a fresh copy of the module via
vi.resetModules(), matching GetAllYoutubeContent.test.ts's pattern.
----------------------------------------------------------------------------- */

const originalEnv = { ...process.env };

const importFreshModule = async () => {
	vi.resetModules();
	return import("./GetPostContentBySlug");
};

const setCmsEnv = () => {
	process.env.NEXT_PUBLIC_CMS_API_URL = "https://example.test/graphql";
};

describe("getPostContentBySlug", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("throws when NEXT_PUBLIC_CMS_API_URL is missing", async () => {
		delete process.env.NEXT_PUBLIC_CMS_API_URL;

		await expect(importFreshModule()).rejects.toThrow("NEXT_PUBLIC_CMS_API_URL not defined.");
	});

	it("returns the post node on a successful query", async () => {
		setCmsEnv();

		const post = {
			title: "A Post Title",
			slug: "a-post-title",
			date: "2026-01-01T00:00:00",
			modified: "2026-01-02T00:00:00",
			content: "<p>Body</p>",
			excerpt: "<p>Excerpt</p>",
			featuredImage: { node: { sourceUrl: "https://example.test/image.jpg", altText: "Alt" } },
			author: { node: { name: "Author Name" } },
			categories: { nodes: [{ name: "News", slug: "news" }] },
		};

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				data: { posts: { edges: [{ node: post }] } },
			}),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getPostContentBySlug } = await importFreshModule();
		const result = await getPostContentBySlug("a-post-title");

		expect(result).toEqual(post);
		expect(mockFetch).toHaveBeenCalledWith(
			"https://example.test/graphql",
			expect.objectContaining({ method: "POST" }),
		);
	});

	it("sends the slug as a GraphQL variable rather than interpolating it into the query string", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ data: { posts: { edges: [] } } }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getPostContentBySlug } = await importFreshModule();
		// A slug containing a quote would break out of a raw string-interpolated
		// query — passed as a variable instead, it can only ever be treated as
		// a plain string value, never as injected GraphQL syntax.
		await getPostContentBySlug('a", status: DRAFT, name: "b');

		const [, requestInit] = mockFetch.mock.calls[0];
		const body = JSON.parse((requestInit as RequestInit).body as string);

		expect(body.variables).toEqual({ slug: 'a", status: DRAFT, name: "b' });
		expect(body.query).not.toContain('a", status: DRAFT, name: "b');
	});

	it("returns undefined when the HTTP response is not ok", async () => {
		setCmsEnv();

		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

		const { getPostContentBySlug } = await importFreshModule();
		const result = await getPostContentBySlug("missing-slug");

		expect(result).toBeUndefined();
	});

	it("returns undefined when the GraphQL response contains errors", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ errors: [{ message: "Bad query" }] }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getPostContentBySlug } = await importFreshModule();
		const result = await getPostContentBySlug("a-post-title");

		expect(result).toBeUndefined();
	});

	it("returns undefined when no post matches the slug", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ data: { posts: { edges: [] } } }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getPostContentBySlug } = await importFreshModule();
		const result = await getPostContentBySlug("unknown-slug");

		expect(result).toBeUndefined();
	});

	it("wraps a thrown fetch error in a generic error", async () => {
		setCmsEnv();

		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

		const { getPostContentBySlug } = await importFreshModule();

		await expect(getPostContentBySlug("a-post-title")).rejects.toThrow(
			'Something went wrong trying to fetch post content for slug "a-post-title"',
		);
	});
});
