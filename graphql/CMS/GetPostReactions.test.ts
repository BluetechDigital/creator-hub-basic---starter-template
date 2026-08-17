import { describe, it, expect, afterEach, vi } from "vitest";

const originalEnv = { ...process.env };

const importFreshModule = async () => {
	vi.resetModules();
	return import("./GetPostReactions");
};

const setCmsEnv = () => {
	process.env.NEXT_PUBLIC_CMS_API_URL = "https://example.test/graphql";
};

describe("getPostReactions", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("throws when NEXT_PUBLIC_CMS_API_URL is missing", async () => {
		delete process.env.NEXT_PUBLIC_CMS_API_URL;

		await expect(importFreshModule()).rejects.toThrow("NEXT_PUBLIC_CMS_API_URL not defined.");
	});

	it("returns the like and dislike counts on success", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ data: { post: { likes: 12, dislikes: 3 } } }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getPostReactions } = await importFreshModule();

		expect(await getPostReactions(307)).toEqual({ likes: 12, dislikes: 3 });
	});

	it("returns undefined (not a throw) when the fields don't exist yet (mu-plugin not installed)", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				errors: [{ message: 'Cannot query field "likes" on type "Post".' }],
			}),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getPostReactions } = await importFreshModule();

		await expect(getPostReactions(307)).resolves.toBeUndefined();
	});

	it("returns undefined when the HTTP response is not ok", async () => {
		setCmsEnv();

		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

		const { getPostReactions } = await importFreshModule();

		expect(await getPostReactions(307)).toBeUndefined();
	});

	it("returns undefined (not a throw) on a network-level failure", async () => {
		setCmsEnv();

		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

		const { getPostReactions } = await importFreshModule();

		await expect(getPostReactions(307)).resolves.toBeUndefined();
	});
});
