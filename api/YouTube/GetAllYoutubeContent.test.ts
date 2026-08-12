import { describe, it, expect, afterEach, vi } from "vitest";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Why the dynamic import XXXXXXXXXXXXXXXXXXXXXXXXXX
YOUTUBE_API_BASE_URL/YOUTUBE_KEY/YOUTUBE_CHANNEL_ID are read into module-scope
consts on import (GetAllYoutubeContent.ts:5-7), not re-read per call. To test
both the "missing env var" and "present env var" paths in the same file, each
test has to set process.env *before* importing a fresh copy of the module —
vi.resetModules() clears vitest's module cache so the next import() re-runs
that module-scope env read.
----------------------------------------------------------------------------- */

const originalEnv = { ...process.env };

const importFreshModule = async () => {
	vi.resetModules();
	return import("./GetAllYoutubeContent");
};

const setYoutubeEnv = () => {
	process.env.YOUTUBE_API_BASE_URL = "https://example.test/youtube/v3";
	process.env.YOUTUBE_KEY = "test-key";
	process.env.YOUTUBE_CHANNEL_ID = "UC_test_channel";
};

describe("GetAllYoutubeContent", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("throws when required env vars are missing", async () => {
		delete process.env.YOUTUBE_API_BASE_URL;
		delete process.env.YOUTUBE_KEY;
		delete process.env.YOUTUBE_CHANNEL_ID;

		const { getAllYoutubeChannelInfo } = await importFreshModule();

		await expect(getAllYoutubeChannelInfo()).rejects.toThrow(
			"Missing YouTube environment variables",
		);
	});

	it("fetches from YOUTUBE_API_BASE_URL and merges snippet + statistics on success", async () => {
		setYoutubeEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				items: [
					{
						snippet: { title: "HeroVoltsy" },
						statistics: { subscriberCount: "1000" },
					},
				],
			}),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getAllYoutubeChannelInfo } = await importFreshModule();
		const result = await getAllYoutubeChannelInfo();

		expect(result).toEqual({ title: "HeroVoltsy", subscriberCount: "1000" });
		expect(mockFetch).toHaveBeenCalledWith(
			expect.stringContaining("https://example.test/youtube/v3/channels"),
			expect.any(Object),
		);
	});

	it("wraps a failed YouTube API response in a generic error", async () => {
		setYoutubeEnv();

		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				status: 403,
				json: async () => ({ error: { message: "quota exceeded" } }),
			}),
		);

		const { getAllYoutubeChannelInfo } = await importFreshModule();

		await expect(getAllYoutubeChannelInfo()).rejects.toThrow(
			"Failed to fetch YouTube channel info content",
		);
	});

	it("throws when no channel is found for the given ID", async () => {
		setYoutubeEnv();

		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ items: [] }),
			}),
		);

		const { getAllYoutubeChannelInfo } = await importFreshModule();

		await expect(getAllYoutubeChannelInfo()).rejects.toThrow(
			"Failed to fetch YouTube channel info content",
		);
	});
});
