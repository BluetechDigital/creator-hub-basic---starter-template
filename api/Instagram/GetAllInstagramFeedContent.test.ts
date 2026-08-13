import { describe, it, expect, afterEach, vi } from "vitest";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Why the dynamic import XXXXXXXXXXXXXXXXXXXXXXXXXX
INSTAGRAM_ACCESS_TOKEN is read into a module-scope const on import, not re-read
per call — same pattern as api/YouTube/GetAllYoutubeContent.test.ts. Each test
sets process.env *before* importing a fresh copy of the module via
vi.resetModules() so that module-scope read re-runs.
----------------------------------------------------------------------------- */

const originalEnv = { ...process.env };

const importFreshModule = async () => {
	vi.resetModules();
	return import("./GetAllInstagramFeedContent");
};

const setInstagramEnv = () => {
	process.env.INSTAGRAM_ACCESS_TOKEN = "test-long-lived-token";
};

describe("getAllInstagramFeedContent", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("throws when INSTAGRAM_ACCESS_TOKEN is missing and no override is passed", async () => {
		delete process.env.INSTAGRAM_ACCESS_TOKEN;

		const { getAllInstagramFeedContent } = await importFreshModule();

		await expect(getAllInstagramFeedContent()).rejects.toThrow(
			"INSTAGRAM_ACCESS_TOKEN environment variable is missing",
		);
	});

	it("refreshes the token first, then fetches the feed using the refreshed token", async () => {
		setInstagramEnv();

		const mockFetch = vi.fn()
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					access_token: "refreshed-token",
					token_type: "bearer",
					expires_in: 5184000,
				}),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					data: [
						{
							id: "1",
							media_type: "IMAGE",
							media_url: "https://cdninstagram.com/img.jpg",
							timestamp: "2026-01-01T00:00:00Z",
							caption: "Test post",
							permalink: "https://instagram.com/p/1",
							username: "creator",
						},
					],
				}),
			});
		vi.stubGlobal("fetch", mockFetch);

		const { getAllInstagramFeedContent } = await importFreshModule();
		const result = await getAllInstagramFeedContent();

		expect(mockFetch).toHaveBeenCalledTimes(2);
		expect(mockFetch).toHaveBeenNthCalledWith(
			1,
			expect.stringContaining("/refresh_access_token?grant_type=ig_refresh_token&access_token=test-long-lived-token"),
			expect.any(Object),
		);
		expect(mockFetch).toHaveBeenNthCalledWith(
			2,
			expect.stringContaining("access_token=refreshed-token"),
			expect.any(Object),
		);
		expect(result).toEqual([
			expect.objectContaining({ id: "1", username: "creator" }),
		]);
	});

	it("falls back to the configured token when the refresh call fails", async () => {
		setInstagramEnv();

		const mockFetch = vi.fn()
			.mockResolvedValueOnce({
				ok: false,
				status: 400,
				json: async () => ({ error: { message: "Invalid token" } }),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ data: [] }),
			});
		vi.stubGlobal("fetch", mockFetch);

		const { getAllInstagramFeedContent } = await importFreshModule();
		const result = await getAllInstagramFeedContent();

		expect(mockFetch).toHaveBeenNthCalledWith(
			2,
			expect.stringContaining("access_token=test-long-lived-token"),
			expect.any(Object),
		);
		expect(result).toEqual([]);
	});

	it("wraps a failed feed-fetch response in a generic error", async () => {
		setInstagramEnv();

		const mockFetch = vi.fn()
			.mockResolvedValueOnce({
				ok: false,
				status: 400,
				json: async () => ({ error: { message: "Invalid token" } }),
			})
			.mockResolvedValueOnce({
				ok: false,
				status: 401,
				json: async () => ({ error: { message: "Unauthorized" } }),
			});
		vi.stubGlobal("fetch", mockFetch);

		const { getAllInstagramFeedContent } = await importFreshModule();

		await expect(getAllInstagramFeedContent()).rejects.toThrow(
			"Failed to retrieve Instagram feed content",
		);
	});

	it("accepts an accessTokenOverride instead of requiring INSTAGRAM_ACCESS_TOKEN", async () => {
		delete process.env.INSTAGRAM_ACCESS_TOKEN;

		const mockFetch = vi.fn()
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ access_token: "refreshed", token_type: "bearer", expires_in: 5184000 }),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ data: [] }),
			});
		vi.stubGlobal("fetch", mockFetch);

		const { getAllInstagramFeedContent } = await importFreshModule();
		await getAllInstagramFeedContent("override-token");

		expect(mockFetch).toHaveBeenNthCalledWith(
			1,
			expect.stringContaining("access_token=override-token"),
			expect.any(Object),
		);
	});
});
