import { describe, it, expect, afterEach, vi } from "vitest";

const originalEnv = { ...process.env };

const importFreshModule = async () => {
	vi.resetModules();
	return import("./GetAllSeoContent");
};

const setCmsEnv = () => {
	process.env.NEXT_PUBLIC_CMS_API_URL = "https://example.test/graphql";
};

describe("getAllSeoContent", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("throws when NEXT_PUBLIC_CMS_API_URL is missing", async () => {
		delete process.env.NEXT_PUBLIC_CMS_API_URL;

		await expect(importFreshModule()).rejects.toThrow("NEXT_PUBLIC_CMS_API_URL not defined.");
	});

	it("returns the SEO node on a successful query", async () => {
		setCmsEnv();

		const seo = { title: "A Post Title", metaDesc: "A description" };

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ data: { seo: { edges: [{ node: { seo } }] } } }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getAllSeoContent } = await importFreshModule();
		const result = await getAllSeoContent("a-post-title", "posts");

		expect(result).toEqual(seo);
	});

	it("sends the slug as a GraphQL variable rather than interpolating it into the query string", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ data: { seo: { edges: [] } } }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getAllSeoContent } = await importFreshModule();
		// A slug containing a quote would break out of a raw string-interpolated
		// query — passed as a variable instead, it can only ever be treated as
		// a plain string value, never as injected GraphQL syntax.
		await getAllSeoContent('a", status: DRAFT, name: "b', "posts");

		const [, requestInit] = mockFetch.mock.calls[0];
		const body = JSON.parse((requestInit as RequestInit).body as string);

		expect(body.variables).toEqual({ slug: 'a", status: DRAFT, name: "b' });
		expect(body.query).not.toContain('a", status: DRAFT, name: "b');
		// postType is still interpolated directly (it's a field name, not a
		// value, so it can't be a GraphQL variable) — confirm it's still wired
		// through correctly.
		expect(body.query).toContain("seo: posts(");
	});

	it("returns undefined when the HTTP response is not ok", async () => {
		setCmsEnv();

		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

		const { getAllSeoContent } = await importFreshModule();
		const result = await getAllSeoContent("missing-slug", "posts");

		expect(result).toBeUndefined();
	});

	it("returns undefined when the GraphQL response contains errors", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ errors: [{ message: "Bad query" }] }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getAllSeoContent } = await importFreshModule();
		const result = await getAllSeoContent("a-post-title", "posts");

		expect(result).toBeUndefined();
	});

	it("throws a generic error on a network-level failure", async () => {
		setCmsEnv();

		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

		const { getAllSeoContent } = await importFreshModule();

		await expect(getAllSeoContent("a-post-title", "posts")).rejects.toThrow(
			"Something went wrong trying to fetch all posts seo content per page",
		);
	});
});
