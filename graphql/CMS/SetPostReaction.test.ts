import { describe, it, expect, afterEach, vi } from "vitest";

const originalEnv = { ...process.env };

const importFreshModule = async () => {
	vi.resetModules();
	return import("./SetPostReaction");
};

const setCmsEnv = () => {
	process.env.NEXT_PUBLIC_CMS_API_URL = "https://example.test/graphql";
};

describe("setPostReaction", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("throws when NEXT_PUBLIC_CMS_API_URL is missing", async () => {
		delete process.env.NEXT_PUBLIC_CMS_API_URL;

		await expect(importFreshModule()).rejects.toThrow("NEXT_PUBLIC_CMS_API_URL not defined.");
	});

	it("returns the updated likes/dislikes on success", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ data: { setPostReaction: { likes: 5, dislikes: 1 } } }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { setPostReaction } = await importFreshModule();

		expect(await setPostReaction(307, undefined, "like")).toEqual({ likes: 5, dislikes: 1 });

		const [, requestInit] = mockFetch.mock.calls[0];
		const body = JSON.parse(requestInit.body);
		expect(body.variables).toEqual({ postId: 307, previousReaction: null, newReaction: "like" });
	});

	it("passes the previous reaction through when swapping", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ data: { setPostReaction: { likes: 4, dislikes: 2 } } }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { setPostReaction } = await importFreshModule();

		await setPostReaction(307, "like", "dislike");

		const [, requestInit] = mockFetch.mock.calls[0];
		const body = JSON.parse(requestInit.body);
		expect(body.variables).toEqual({ postId: 307, previousReaction: "like", newReaction: "dislike" });
	});

	it("returns undefined (not a throw) when the mutation doesn't exist yet (mu-plugin not installed)", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				errors: [{ message: 'Unknown field "setPostReaction" on type "RootMutation".' }],
			}),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { setPostReaction } = await importFreshModule();

		await expect(setPostReaction(307, undefined, "like")).resolves.toBeUndefined();
	});

	it("returns undefined when the HTTP response is not ok", async () => {
		setCmsEnv();

		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

		const { setPostReaction } = await importFreshModule();

		expect(await setPostReaction(307, undefined, "like")).toBeUndefined();
	});

	it("returns undefined (not a throw) on a network-level failure", async () => {
		setCmsEnv();

		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

		const { setPostReaction } = await importFreshModule();

		await expect(setPostReaction(307, undefined, "like")).resolves.toBeUndefined();
	});
});
