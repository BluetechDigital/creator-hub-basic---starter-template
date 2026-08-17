import { describe, it, expect, afterEach, vi } from "vitest";

const originalEnv = { ...process.env };

const importFreshModule = async () => {
	vi.resetModules();
	return import("./GetPostComments");
};

const setCmsEnv = () => {
	process.env.NEXT_PUBLIC_CMS_API_URL = "https://example.test/graphql";
};

describe("getPostComments", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("throws when NEXT_PUBLIC_CMS_API_URL is missing", async () => {
		delete process.env.NEXT_PUBLIC_CMS_API_URL;

		await expect(importFreshModule()).rejects.toThrow("NEXT_PUBLIC_CMS_API_URL not defined.");
	});

	it("returns the comment count and comments on success", async () => {
		setCmsEnv();

		const comment = {
			id: "1",
			content: "<p>Great post!</p>",
			date: "2026-01-05T00:00:00",
			author: { node: { name: "Jane Doe" } },
		};

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				data: { post: { commentCount: 1, comments: { nodes: [comment] } } },
			}),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getPostComments } = await importFreshModule();

		expect(await getPostComments(307)).toEqual({ commentCount: 1, comments: [comment] });
	});

	it("passes nested replies through unchanged", async () => {
		setCmsEnv();

		const comment = {
			id: "1",
			content: "<p>Great post!</p>",
			date: "2026-01-05T00:00:00",
			author: { node: { name: "Jane Doe" } },
			replies: {
				nodes: [
					{ id: "2", content: "<p>Agreed!</p>", date: "2026-01-06T00:00:00", author: { node: { name: "John Smith" } } },
				],
			},
		};

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ data: { post: { commentCount: 2, comments: { nodes: [comment] } } } }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getPostComments } = await importFreshModule();

		expect(await getPostComments(307)).toEqual({ commentCount: 2, comments: [comment] });
	});

	it("defaults to a count of 0 and an empty list when the post has no comments", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ data: { post: { commentCount: 0, comments: { nodes: [] } } } }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getPostComments } = await importFreshModule();

		expect(await getPostComments(307)).toEqual({ commentCount: 0, comments: [] });
	});

	it("returns undefined when the HTTP response is not ok", async () => {
		setCmsEnv();

		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

		const { getPostComments } = await importFreshModule();

		expect(await getPostComments(307)).toBeUndefined();
	});

	it("returns undefined when the GraphQL response contains errors", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ errors: [{ message: "Bad query" }] }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getPostComments } = await importFreshModule();

		expect(await getPostComments(307)).toBeUndefined();
	});

	it("returns undefined (not a throw) on a network-level failure", async () => {
		setCmsEnv();

		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

		const { getPostComments } = await importFreshModule();

		await expect(getPostComments(307)).resolves.toBeUndefined();
	});
});
