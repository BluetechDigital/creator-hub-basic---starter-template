import { describe, it, expect, afterEach, vi } from "vitest";

const originalEnv = { ...process.env };

const importFreshModule = async () => {
	vi.resetModules();
	return import("./GetAllPostsSummaries");
};

const setCmsEnv = () => {
	process.env.NEXT_PUBLIC_CMS_API_URL = "https://example.test/graphql";
};

describe("getAllPostsSummaries", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("throws when NEXT_PUBLIC_CMS_API_URL is missing", async () => {
		delete process.env.NEXT_PUBLIC_CMS_API_URL;

		await expect(importFreshModule()).rejects.toThrow("NEXT_PUBLIC_CMS_API_URL not defined.");
	});

	it("returns posts and pageInfo on a successful query", async () => {
		setCmsEnv();

		const summary = {
			title: "A Post",
			slug: "a-post",
			date: "2026-01-01T00:00:00",
			excerpt: "<p>Excerpt</p>",
			featuredImage: null,
		};
		const pageInfo = { hasNextPage: true, endCursor: "cursor-1" };

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ data: { posts: { nodes: [summary], pageInfo } } }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getAllPostsSummaries } = await importFreshModule();
		const result = await getAllPostsSummaries(24);

		expect(result).toEqual({ posts: [summary], pageInfo });
	});

	it("sends first/after as GraphQL variables rather than interpolating them into the query string", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ data: { posts: { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } } } }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getAllPostsSummaries } = await importFreshModule();
		// A cursor containing a quote would break out of a raw string-interpolated
		// query — passed as a variable instead, it can only ever be treated as a
		// plain string value, never as injected GraphQL syntax.
		await getAllPostsSummaries(12, 'cursor", first: 9999, where: {status: DRAFT}, after: "');

		const [, requestInit] = mockFetch.mock.calls[0];
		const body = JSON.parse((requestInit as RequestInit).body as string);

		expect(body.variables).toEqual({ first: 12, after: 'cursor", first: 9999, where: {status: DRAFT}, after: "' });
		expect(body.query).not.toContain('cursor", first: 9999');
	});

	it("returns undefined when the HTTP response is not ok", async () => {
		setCmsEnv();

		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

		const { getAllPostsSummaries } = await importFreshModule();

		expect(await getAllPostsSummaries()).toBeUndefined();
	});

	it("returns undefined when the GraphQL response contains errors", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ errors: [{ message: "Bad query" }] }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getAllPostsSummaries } = await importFreshModule();

		expect(await getAllPostsSummaries()).toBeUndefined();
	});

	it("wraps a thrown fetch error in a generic error", async () => {
		setCmsEnv();

		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

		const { getAllPostsSummaries } = await importFreshModule();

		await expect(getAllPostsSummaries()).rejects.toThrow(
			"Something went wrong trying to fetch all posts summaries",
		);
	});
});
