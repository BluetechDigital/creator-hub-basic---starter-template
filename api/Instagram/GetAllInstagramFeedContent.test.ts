import { describe, it, expect, afterEach, vi } from "vitest";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Why the dynamic import XXXXXXXXXXXXXXXXXXXXXXXXXX
The token now comes from `getInstagramToken` (Edge Config → env fallback), not a
module-scope env read — mock that module. `refreshInstagramAccessToken` still
lives here (exported for the cron) but `getAllInstagramFeedContent` no longer
calls it.
----------------------------------------------------------------------------- */

const { mockGetInstagramToken } = vi.hoisted(() => ({ mockGetInstagramToken: vi.fn() }));

vi.mock("@/config/instagramToken", () => ({
	getInstagramToken: mockGetInstagramToken,
	persistInstagramToken: vi.fn(),
}));

const importFreshModule = async () => {
	vi.resetModules();
	return import("./GetAllInstagramFeedContent");
};

const feedResponse = (data: unknown[]) => ({ ok: true, json: async () => ({ data }) });

describe("getAllInstagramFeedContent", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.clearAllMocks();
	});

	it("throws when no token is available and no override is passed", async () => {
		mockGetInstagramToken.mockResolvedValue(undefined);

		const { getAllInstagramFeedContent } = await importFreshModule();

		await expect(getAllInstagramFeedContent()).rejects.toThrow(
			"INSTAGRAM_ACCESS_TOKEN environment variable is missing",
		);
	});

	it("fetches the feed with the token from getInstagramToken", async () => {
		mockGetInstagramToken.mockResolvedValue("stored-token");

		const mockFetch = vi.fn().mockResolvedValue(
			feedResponse([
				{
					id: "1",
					media_type: "IMAGE",
					media_url: "https://cdninstagram.com/img.jpg",
					timestamp: "2026-01-01T00:00:00Z",
					caption: "Test post",
					permalink: "https://instagram.com/p/1",
					username: "creator",
				},
			]),
		);
		vi.stubGlobal("fetch", mockFetch);

		const { getAllInstagramFeedContent } = await importFreshModule();
		const result = await getAllInstagramFeedContent();

		expect(mockFetch).toHaveBeenCalledTimes(1);
		expect(mockFetch).toHaveBeenCalledWith(
			expect.stringContaining("/me/media?fields="),
			expect.any(Object),
		);
		expect(mockFetch).toHaveBeenCalledWith(
			expect.stringContaining("access_token=stored-token"),
			expect.any(Object),
		);
		expect(result).toEqual([expect.objectContaining({ id: "1", username: "creator" })]);
	});

	it("accepts an accessTokenOverride instead of the stored token", async () => {
		mockGetInstagramToken.mockResolvedValue(undefined);

		const mockFetch = vi.fn().mockResolvedValue(feedResponse([]));
		vi.stubGlobal("fetch", mockFetch);

		const { getAllInstagramFeedContent } = await importFreshModule();
		await getAllInstagramFeedContent("override-token");

		expect(mockGetInstagramToken).not.toHaveBeenCalled();
		expect(mockFetch).toHaveBeenCalledWith(
			expect.stringContaining("access_token=override-token"),
			expect.any(Object),
		);
	});

	it("wraps a failed feed-fetch response in a generic error", async () => {
		mockGetInstagramToken.mockResolvedValue("stored-token");

		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				status: 401,
				json: async () => ({ error: { message: "Unauthorized" } }),
			}),
		);

		const { getAllInstagramFeedContent } = await importFreshModule();

		await expect(getAllInstagramFeedContent()).rejects.toThrow(
			"Failed to retrieve Instagram feed content",
		);
	});
});

describe("refreshInstagramAccessToken", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.clearAllMocks();
	});

	it("returns the rotated token and its expiry on success", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ access_token: "rotated", token_type: "bearer", expires_in: 5184000 }),
			}),
		);

		const { refreshInstagramAccessToken } = await importFreshModule();
		const result = await refreshInstagramAccessToken("old-token");

		expect(result?.accessToken).toBe("rotated");
		expect(result?.expiresAt).toBeInstanceOf(Date);
	});

	it("returns null (swallowed) when the refresh call fails", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: { message: "bad" } }) }),
		);

		const { refreshInstagramAccessToken } = await importFreshModule();
		expect(await refreshInstagramAccessToken("old-token")).toBeNull();
	});
});
