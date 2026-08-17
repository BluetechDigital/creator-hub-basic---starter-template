import { describe, it, expect, afterEach, vi } from "vitest";

const originalEnv = { ...process.env };

const importFreshModule = async () => {
	vi.resetModules();
	return import("./IncrementPostLikes");
};

const setCmsEnv = () => {
	process.env.NEXT_PUBLIC_CMS_API_URL = "https://example.test/graphql";
};

describe("incrementPostLikes", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("throws when NEXT_PUBLIC_CMS_API_URL is missing", async () => {
		delete process.env.NEXT_PUBLIC_CMS_API_URL;

		await expect(importFreshModule()).rejects.toThrow("NEXT_PUBLIC_CMS_API_URL not defined.");
	});

	it("returns the new like count on success", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ data: { incrementPostLikes: { likes: 5 } } }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { incrementPostLikes } = await importFreshModule();
		const result = await incrementPostLikes(307);

		expect(result).toBe(5);

		const [, requestInit] = mockFetch.mock.calls[0];
		const body = JSON.parse((requestInit as RequestInit).body as string);
		expect(body.variables).toEqual({ postId: 307 });
	});

	it("returns undefined (not a throw) when the mutation doesn't exist yet (mu-plugin not installed)", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				errors: [{ message: 'Unknown field "incrementPostLikes" on type "RootMutation".' }],
			}),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { incrementPostLikes } = await importFreshModule();

		await expect(incrementPostLikes(307)).resolves.toBeUndefined();
	});

	it("returns undefined when the HTTP response is not ok", async () => {
		setCmsEnv();

		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

		const { incrementPostLikes } = await importFreshModule();

		expect(await incrementPostLikes(307)).toBeUndefined();
	});

	it("returns undefined (not a throw) on a network-level failure", async () => {
		setCmsEnv();

		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

		const { incrementPostLikes } = await importFreshModule();

		await expect(incrementPostLikes(307)).resolves.toBeUndefined();
	});
});
