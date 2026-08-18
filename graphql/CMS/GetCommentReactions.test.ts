import { describe, it, expect, afterEach, vi } from "vitest";

const originalEnv = { ...process.env };

const importFreshModule = async () => {
	vi.resetModules();
	return import("./GetCommentReactions");
};

const setCmsEnv = () => {
	process.env.NEXT_PUBLIC_CMS_API_URL = "https://example.test/graphql";
};

describe("getCommentReactions", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("throws when NEXT_PUBLIC_CMS_API_URL is missing", async () => {
		delete process.env.NEXT_PUBLIC_CMS_API_URL;

		await expect(importFreshModule()).rejects.toThrow("NEXT_PUBLIC_CMS_API_URL not defined.");
	});

	it("returns an empty map without fetching when given no comment ids", async () => {
		setCmsEnv();

		const mockFetch = vi.fn();
		vi.stubGlobal("fetch", mockFetch);

		const { getCommentReactions } = await importFreshModule();

		expect(await getCommentReactions([])).toEqual({});
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it("returns a map keyed by databaseId on success", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				data: {
					comments: {
						nodes: [
							{ databaseId: 2, likes: 5, dislikes: 1 },
							{ databaseId: 3, likes: 0, dislikes: 2 },
						],
					},
				},
			}),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getCommentReactions } = await importFreshModule();

		expect(await getCommentReactions([2, 3])).toEqual({
			2: { likes: 5, dislikes: 1 },
			3: { likes: 0, dislikes: 2 },
		});

		const [, requestInit] = mockFetch.mock.calls[0];
		const body = JSON.parse((requestInit as RequestInit).body as string);
		expect(body.variables).toEqual({ commentDatabaseIds: [2, 3] });
	});

	it("returns undefined when the fields don't exist yet (mu-plugin not installed)", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ errors: [{ message: 'Cannot query field "likes" on type "Comment".' }] }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getCommentReactions } = await importFreshModule();

		await expect(getCommentReactions([2])).resolves.toBeUndefined();
	});

	it("returns undefined when the HTTP response is not ok", async () => {
		setCmsEnv();

		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

		const { getCommentReactions } = await importFreshModule();

		expect(await getCommentReactions([2])).toBeUndefined();
	});

	it("returns undefined (not a throw) on a network-level failure", async () => {
		setCmsEnv();

		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

		const { getCommentReactions } = await importFreshModule();

		await expect(getCommentReactions([2])).resolves.toBeUndefined();
	});
});
