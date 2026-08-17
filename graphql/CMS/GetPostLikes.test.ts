import { describe, it, expect, afterEach, vi } from "vitest";

const originalEnv = { ...process.env };

const importFreshModule = async () => {
	vi.resetModules();
	return import("./GetPostLikes");
};

const setCmsEnv = () => {
	process.env.NEXT_PUBLIC_CMS_API_URL = "https://example.test/graphql";
};

describe("getPostLikes", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("throws when NEXT_PUBLIC_CMS_API_URL is missing", async () => {
		delete process.env.NEXT_PUBLIC_CMS_API_URL;

		await expect(importFreshModule()).rejects.toThrow("NEXT_PUBLIC_CMS_API_URL not defined.");
	});

	it("returns the like count on success", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ data: { post: { likes: 12 } } }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getPostLikes } = await importFreshModule();

		expect(await getPostLikes(307)).toBe(12);
	});

	it("returns undefined (not a throw) when the field doesn't exist yet (mu-plugin not installed)", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				errors: [{ message: 'Cannot query field "likes" on type "Post".' }],
			}),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getPostLikes } = await importFreshModule();

		await expect(getPostLikes(307)).resolves.toBeUndefined();
	});

	it("returns undefined when the HTTP response is not ok", async () => {
		setCmsEnv();

		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

		const { getPostLikes } = await importFreshModule();

		expect(await getPostLikes(307)).toBeUndefined();
	});

	it("returns undefined (not a throw) on a network-level failure", async () => {
		setCmsEnv();

		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

		const { getPostLikes } = await importFreshModule();

		await expect(getPostLikes(307)).resolves.toBeUndefined();
	});
});
