import { describe, it, expect, afterEach, vi } from "vitest";

const originalEnv = { ...process.env };

const importFreshModule = async () => {
	vi.resetModules();
	return import("./SetCommentReaction");
};

const setCmsEnv = () => {
	process.env.NEXT_PUBLIC_CMS_API_URL = "https://example.test/graphql";
};

describe("setCommentReaction", () => {
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
			json: async () => ({ data: { setCommentReaction: { likes: 5, dislikes: 1 } } }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { setCommentReaction } = await importFreshModule();

		expect(await setCommentReaction(2, undefined, "like")).toEqual({ likes: 5, dislikes: 1 });

		const [, requestInit] = mockFetch.mock.calls[0];
		const body = JSON.parse(requestInit.body);
		expect(body.variables).toEqual({ commentId: 2, previousReaction: null, newReaction: "like" });
	});

	it("passes the previous reaction through when swapping", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ data: { setCommentReaction: { likes: 4, dislikes: 2 } } }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { setCommentReaction } = await importFreshModule();

		await setCommentReaction(2, "like", "dislike");

		const [, requestInit] = mockFetch.mock.calls[0];
		const body = JSON.parse(requestInit.body);
		expect(body.variables).toEqual({ commentId: 2, previousReaction: "like", newReaction: "dislike" });
	});

	it("returns undefined (not a throw) when the mutation doesn't exist yet (mu-plugin not installed)", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				errors: [{ message: 'Unknown field "setCommentReaction" on type "RootMutation".' }],
			}),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { setCommentReaction } = await importFreshModule();

		await expect(setCommentReaction(2, undefined, "like")).resolves.toBeUndefined();
	});

	it("returns undefined when the HTTP response is not ok", async () => {
		setCmsEnv();

		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

		const { setCommentReaction } = await importFreshModule();

		expect(await setCommentReaction(2, undefined, "like")).toBeUndefined();
	});

	it("returns undefined (not a throw) on a network-level failure", async () => {
		setCmsEnv();

		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

		const { setCommentReaction } = await importFreshModule();

		await expect(setCommentReaction(2, undefined, "like")).resolves.toBeUndefined();
	});
});
