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

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Youtube Videos XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
Covers the playlistItems.list-based rewrite (replacing the old search.list call,
which cost 100 quota units/call vs. 1 for playlistItems.list).
----------------------------------------------------------------------------- */

describe("getAllYoutubeVideos", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("resolves the uploads playlist via channels.list when YOUTUBE_PLAYLIST_ID is unset, then fetches video IDs and details", async () => {
		setYoutubeEnv();
		delete process.env.YOUTUBE_PLAYLIST_ID;

		const mockFetch = vi.fn()
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					items: [{ contentDetails: { relatedPlaylists: { uploads: "UU_test_uploads" } } }],
				}),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					items: [
						{ contentDetails: { videoId: "vid1" } },
						{ contentDetails: { videoId: "vid2" } },
					],
				}),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					items: [
						{ id: "vid1", snippet: { title: "Video One" }, statistics: { viewCount: "10" }, status: {} },
						{ id: "vid2", snippet: { title: "Video Two" }, statistics: { viewCount: "20" }, status: {} },
					],
				}),
			});
		vi.stubGlobal("fetch", mockFetch);

		const { getAllYoutubeVideos } = await importFreshModule();
		const result = await getAllYoutubeVideos();

		expect(mockFetch).toHaveBeenCalledTimes(3);
		expect(mockFetch).toHaveBeenNthCalledWith(
			1,
			expect.stringContaining("/channels?part=contentDetails"),
			expect.any(Object),
		);
		expect(mockFetch).toHaveBeenNthCalledWith(
			2,
			expect.stringContaining("/playlistItems?part=contentDetails&playlistId=UU_test_uploads"),
			expect.any(Object),
		);
		expect(mockFetch).toHaveBeenNthCalledWith(
			3,
			expect.stringContaining("/videos?part=snippet,statistics,status&id=vid1,vid2"),
			expect.any(Object),
		);
		expect(result).toEqual([
			{ id: "vid1", videoId: "vid1", snippet: { title: "Video One" }, statistics: { viewCount: "10" }, status: {} },
			{ id: "vid2", videoId: "vid2", snippet: { title: "Video Two" }, statistics: { viewCount: "20" }, status: {} },
		]);
	});

	it("uses YOUTUBE_PLAYLIST_ID directly when set, skipping the channels.list lookup", async () => {
		setYoutubeEnv();
		process.env.YOUTUBE_PLAYLIST_ID = "UU_explicit_playlist";

		const mockFetch = vi.fn()
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ items: [{ contentDetails: { videoId: "vid1" } }] }),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					items: [{ id: "vid1", snippet: { title: "Video One" }, statistics: { viewCount: "10" }, status: {} }],
				}),
			});
		vi.stubGlobal("fetch", mockFetch);

		const { getAllYoutubeVideos } = await importFreshModule();
		await getAllYoutubeVideos();

		expect(mockFetch).toHaveBeenCalledTimes(2);
		expect(mockFetch).toHaveBeenNthCalledWith(
			1,
			expect.stringContaining("/playlistItems?part=contentDetails&playlistId=UU_explicit_playlist"),
			expect.any(Object),
		);
	});

	it("returns an empty array without fetching video details when the uploads playlist has no videos", async () => {
		setYoutubeEnv();
		process.env.YOUTUBE_PLAYLIST_ID = "UU_empty_playlist";

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ items: [] }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getAllYoutubeVideos } = await importFreshModule();
		const result = await getAllYoutubeVideos();

		expect(result).toEqual([]);
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it("wraps a failed channels.list response in a generic error", async () => {
		setYoutubeEnv();
		delete process.env.YOUTUBE_PLAYLIST_ID;

		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				status: 403,
				json: async () => ({ error: { message: "quota exceeded" } }),
			}),
		);

		const { getAllYoutubeVideos } = await importFreshModule();

		await expect(getAllYoutubeVideos()).rejects.toThrow(
			"Failed to retrieve YouTube videos content",
		);
	});
});
