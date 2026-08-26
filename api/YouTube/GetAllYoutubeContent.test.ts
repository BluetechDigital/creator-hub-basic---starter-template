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
						{ id: "vid1", snippet: { title: "Video One" }, statistics: { viewCount: "10" }, status: {}, contentDetails: { duration: "PT4M13S" } },
						{ id: "vid2", snippet: { title: "Video Two" }, statistics: { viewCount: "20" }, status: {}, contentDetails: { duration: "PT45S" } },
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
			expect.stringContaining(
				"/videos?part=snippet,statistics,status,contentDetails,player,topicDetails,liveStreamingDetails,recordingDetails,localizations&id=vid1,vid2",
			),
			expect.any(Object),
		);
		expect(result).toEqual([
			{ id: "vid1", videoId: "vid1", snippet: { title: "Video One" }, statistics: { viewCount: "10" }, status: {}, contentDetails: { duration: "PT4M13S" } },
			{ id: "vid2", videoId: "vid2", snippet: { title: "Video Two" }, statistics: { viewCount: "20" }, status: {}, contentDetails: { duration: "PT45S" } },
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

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX Youtube Playlists XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

describe("getAllYoutubePlaylists", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("returns each playlist's id and title, discarding the rest of the snippet", async () => {
		setYoutubeEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				items: [
					{ id: "pl1", snippet: { title: "Full Episodes", description: "ignored" } },
					{ id: "pl2", snippet: { title: "Shorts", description: "ignored" } },
				],
			}),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getAllYoutubePlaylists } = await importFreshModule();

		expect(await getAllYoutubePlaylists()).toEqual([
			{ id: "pl1", title: "Full Episodes" },
			{ id: "pl2", title: "Shorts" },
		]);
	});

	it("wraps a failed playlists.list response in a generic error", async () => {
		setYoutubeEnv();

		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }));

		const { getAllYoutubePlaylists } = await importFreshModule();

		await expect(getAllYoutubePlaylists()).rejects.toThrow("Failed to fetch YouTube playlists content");
	});
});

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX Single Youtube Video XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

describe("getYoutubeVideoById", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("throws when required env vars are missing", async () => {
		delete process.env.YOUTUBE_API_BASE_URL;
		delete process.env.YOUTUBE_KEY;

		const { getYoutubeVideoById } = await importFreshModule();

		await expect(getYoutubeVideoById("vid1")).rejects.toThrow("Missing YouTube environment variables");
	});

	it("returns the video's full details on success", async () => {
		setYoutubeEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ items: [{ id: "vid1", snippet: { title: "Video One" }, statistics: { viewCount: "10" } }] }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getYoutubeVideoById } = await importFreshModule();

		expect(await getYoutubeVideoById("vid1")).toEqual({
			id: "vid1",
			videoId: "vid1",
			snippet: { title: "Video One" },
			statistics: { viewCount: "10" },
		});
		expect(mockFetch).toHaveBeenCalledWith(
			expect.stringContaining("/videos?part=snippet,statistics,status,contentDetails,player,topicDetails,liveStreamingDetails,recordingDetails,localizations&id=vid1"),
			expect.any(Object),
		);
	});

	it("returns undefined (not a throw) when the video ID doesn't resolve to a video", async () => {
		setYoutubeEnv();

		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [] }) }));

		const { getYoutubeVideoById } = await importFreshModule();

		await expect(getYoutubeVideoById("not-a-real-id")).resolves.toBeUndefined();
	});

	it("throws on a genuine API failure", async () => {
		setYoutubeEnv();

		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({ error: { message: "quota exceeded" } }) }),
		);

		const { getYoutubeVideoById } = await importFreshModule();

		await expect(getYoutubeVideoById("vid1")).rejects.toThrow("Failed to fetch YouTube video content");
	});
});

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX Youtube Videos By ID (specific set) XXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

describe("getYoutubeVideosByIds", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("throws when required env vars are missing", async () => {
		delete process.env.YOUTUBE_API_BASE_URL;
		delete process.env.YOUTUBE_KEY;

		const { getYoutubeVideosByIds } = await importFreshModule();

		await expect(getYoutubeVideosByIds(["vid1"])).rejects.toThrow("Missing YouTube environment variables");
	});

	it("returns full details for the given IDs in one videos.list call", async () => {
		setYoutubeEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				items: [
					{ id: "vid1", snippet: { title: "Video One" }, statistics: {}, contentDetails: { duration: "PT4M" } },
					{ id: "vid2", snippet: { title: "Video Two" }, statistics: {}, contentDetails: { duration: "PT5M" } },
				],
			}),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getYoutubeVideosByIds } = await importFreshModule();
		const result = await getYoutubeVideosByIds(["vid1", "vid2"]);

		expect(result.map((video) => video.videoId)).toEqual(["vid1", "vid2"]);
		expect(mockFetch).toHaveBeenCalledTimes(1);
		expect(mockFetch).toHaveBeenCalledWith(
			expect.stringContaining("/videos?part=snippet,statistics,status,contentDetails,player,topicDetails,liveStreamingDetails,recordingDetails,localizations&id=vid1,vid2"),
			expect.any(Object),
		);
	});

	it("returns an empty array (no fetch made) for an empty ID list", async () => {
		setYoutubeEnv();

		const mockFetch = vi.fn();
		vi.stubGlobal("fetch", mockFetch);

		const { getYoutubeVideosByIds } = await importFreshModule();

		expect(await getYoutubeVideosByIds([])).toEqual([]);
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it("throws on a genuine API failure", async () => {
		setYoutubeEnv();

		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({ error: { message: "quota exceeded" } }) }),
		);

		const { getYoutubeVideosByIds } = await importFreshModule();

		await expect(getYoutubeVideosByIds(["vid1"])).rejects.toThrow("Failed to retrieve YouTube videos content");
	});
});

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXX Playlist Video Membership XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

describe("getPlaylistVideoIds", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("returns the playlist's video IDs on success", async () => {
		setYoutubeEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ items: [{ contentDetails: { videoId: "vid1" } }, { contentDetails: { videoId: "vid2" } }] }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getPlaylistVideoIds } = await importFreshModule();

		expect(await getPlaylistVideoIds("pl1")).toEqual(["vid1", "vid2"]);
	});

	it("returns an empty array (not a throw) when env vars are missing", async () => {
		delete process.env.YOUTUBE_API_BASE_URL;
		delete process.env.YOUTUBE_KEY;

		const { getPlaylistVideoIds } = await importFreshModule();

		await expect(getPlaylistVideoIds("pl1")).resolves.toEqual([]);
	});

	it("returns an empty array (not a throw) when the request fails", async () => {
		setYoutubeEnv();

		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

		const { getPlaylistVideoIds } = await importFreshModule();

		await expect(getPlaylistVideoIds("pl1")).resolves.toEqual([]);
	});

	it("returns an empty array (not a throw) on a network-level failure", async () => {
		setYoutubeEnv();

		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

		const { getPlaylistVideoIds } = await importFreshModule();

		await expect(getPlaylistVideoIds("pl1")).resolves.toEqual([]);
	});

	it("follows nextPageToken across multiple raw pages to return the playlist's complete membership — the confirmed fix for the filter mismatch bug", async () => {
		setYoutubeEnv();

		const mockFetch = vi.fn()
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					items: [{ contentDetails: { videoId: "vid1" } }, { contentDetails: { videoId: "vid2" } }],
					nextPageToken: "page-2-token",
				}),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ items: [{ contentDetails: { videoId: "vid3" } }] }),
			});
		vi.stubGlobal("fetch", mockFetch);

		const { getPlaylistVideoIds } = await importFreshModule();

		expect(await getPlaylistVideoIds("pl1")).toEqual(["vid1", "vid2", "vid3"]);
		expect(mockFetch).toHaveBeenCalledTimes(2);
		expect(mockFetch).toHaveBeenNthCalledWith(
			2,
			expect.stringContaining("pageToken=page-2-token"),
			expect.any(Object),
		);
	});
});

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX All Qualifying Video IDs (full walk) XXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

describe("getAllQualifyingVideoIds", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("walks the entire catalog across multiple raw pages, filtering by duration", async () => {
		setYoutubeEnv();
		process.env.YOUTUBE_PLAYLIST_ID = "UU_test_uploads";

		const mockFetch = vi.fn()
			// Raw page 1: 2 items, one Short.
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					items: [{ contentDetails: { videoId: "vid1" } }, { contentDetails: { videoId: "vid2" } }],
					nextPageToken: "page-2-token",
				}),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					items: [
						{ id: "vid1", snippet: { title: "Regular Video" }, statistics: {}, contentDetails: { duration: "PT4M" } },
						{ id: "vid2", snippet: { title: "A Short" }, statistics: {}, contentDetails: { duration: "PT30S" } },
					],
				}),
			})
			// Raw page 2: 1 item, qualifies, no further pages.
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ items: [{ contentDetails: { videoId: "vid3" } }] }),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					items: [{ id: "vid3", snippet: { title: "Another Regular Video" }, statistics: {}, contentDetails: { duration: "PT3M" } }],
				}),
			});
		vi.stubGlobal("fetch", mockFetch);

		const { getAllQualifyingVideoIds } = await importFreshModule();
		const result = await getAllQualifyingVideoIds({ minDurationSeconds: 60 });

		expect(result).toEqual(["vid1", "vid3"]);
		expect(mockFetch).toHaveBeenCalledTimes(4);
	});

	it("returns every video when minDurationSeconds is omitted", async () => {
		setYoutubeEnv();
		process.env.YOUTUBE_PLAYLIST_ID = "UU_test_uploads";

		const mockFetch = vi.fn()
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ items: [{ contentDetails: { videoId: "vid1" } }, { contentDetails: { videoId: "vid2" } }] }),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					items: [
						{ id: "vid1", snippet: {}, statistics: {}, contentDetails: { duration: "PT4M" } },
						{ id: "vid2", snippet: {}, statistics: {}, contentDetails: { duration: "PT30S" } },
					],
				}),
			});
		vi.stubGlobal("fetch", mockFetch);

		const { getAllQualifyingVideoIds } = await importFreshModule();

		expect(await getAllQualifyingVideoIds()).toEqual(["vid1", "vid2"]);
	});

	it("deduplicates a video that appears more than once in the playlist — confirmed live as the cause of a real React duplicate-key warning", async () => {
		setYoutubeEnv();
		process.env.YOUTUBE_PLAYLIST_ID = "UU_test_uploads";

		const mockFetch = vi.fn()
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					items: [{ contentDetails: { videoId: "vid1" } }, { contentDetails: { videoId: "vid1" } }],
				}),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					items: [
						{ id: "vid1", snippet: {}, statistics: {}, contentDetails: { duration: "PT4M" } },
						{ id: "vid1", snippet: {}, statistics: {}, contentDetails: { duration: "PT4M" } },
					],
				}),
			});
		vi.stubGlobal("fetch", mockFetch);

		const { getAllQualifyingVideoIds } = await importFreshModule();

		expect(await getAllQualifyingVideoIds()).toEqual(["vid1"]);
	});

	it("returns an empty array for an empty playlist", async () => {
		setYoutubeEnv();
		process.env.YOUTUBE_PLAYLIST_ID = "UU_empty_playlist";

		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [] }) }));

		const { getAllQualifyingVideoIds } = await importFreshModule();

		expect(await getAllQualifyingVideoIds({ minDurationSeconds: 60 })).toEqual([]);
	});

	it("throws when required env vars are missing", async () => {
		delete process.env.YOUTUBE_API_BASE_URL;
		delete process.env.YOUTUBE_KEY;
		delete process.env.YOUTUBE_CHANNEL_ID;

		const { getAllQualifyingVideoIds } = await importFreshModule();

		await expect(getAllQualifyingVideoIds({ minDurationSeconds: 60 })).rejects.toThrow(
			"Missing YouTube environment variables",
		);
	});
});

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX All Qualifying Video Summaries XXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

describe("getAllQualifyingVideoSummaries", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("returns videoId + publishedAt + title for every qualifying video — what app/sitemap.ts needs for the URL and lastmod", async () => {
		setYoutubeEnv();
		process.env.YOUTUBE_PLAYLIST_ID = "UU_test_uploads";

		const mockFetch = vi.fn()
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ items: [{ contentDetails: { videoId: "vid1" } }] }),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					items: [
						{ id: "vid1", snippet: { publishedAt: "2026-01-01T00:00:00Z", title: "Test Video" }, statistics: {}, contentDetails: { duration: "PT4M" } },
					],
				}),
			});
		vi.stubGlobal("fetch", mockFetch);

		const { getAllQualifyingVideoSummaries } = await importFreshModule();

		expect(await getAllQualifyingVideoSummaries({ minDurationSeconds: 60 })).toEqual([
			{ videoId: "vid1", publishedAt: "2026-01-01T00:00:00Z", title: "Test Video" },
		]);
	});
});

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Youtube Videos (paginated) XXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

describe("getYoutubeVideosPage", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("returns exactly targetCount videos even when a single raw page qualifies more than that — the confirmed bug this replaced (a first version returned all 50 from one raw page instead of the requested 12)", async () => {
		setYoutubeEnv();
		process.env.YOUTUBE_PLAYLIST_ID = "UU_test_uploads";

		const mockFetch = vi.fn()
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					items: [
						{ contentDetails: { videoId: "vid1" } },
						{ contentDetails: { videoId: "vid2" } },
						{ contentDetails: { videoId: "vid3" } },
					],
					// No nextPageToken: this is the whole raw catalog, but it still
					// has 3 qualifying videos for a targetCount of 2.
				}),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					items: [
						{ id: "vid1", snippet: { title: "Video One" }, statistics: {}, contentDetails: { duration: "PT4M" } },
						{ id: "vid2", snippet: { title: "Video Two" }, statistics: {}, contentDetails: { duration: "PT5M" } },
						{ id: "vid3", snippet: { title: "Video Three" }, statistics: {}, contentDetails: { duration: "PT6M" } },
					],
				}),
			});
		vi.stubGlobal("fetch", mockFetch);

		const { getYoutubeVideosPage } = await importFreshModule();
		const result = await getYoutubeVideosPage({ targetCount: 2, minDurationSeconds: 60 });

		expect(result.videos.map((video) => video.videoId)).toEqual(["vid1", "vid2"]);
		// vid3 isn't lost — it's carried forward in the resume token, not discarded.
		expect(result.nextPageToken).toBeDefined();
		expect(JSON.parse(result.nextPageToken as string)).toEqual({
			rawPageToken: undefined,
			leftoverVideoIds: ["vid3"],
		});
	});

	it("drains a previous call's leftover overflow before fetching any further raw pages", async () => {
		setYoutubeEnv();
		process.env.YOUTUBE_PLAYLIST_ID = "UU_test_uploads";

		const mockFetch = vi.fn().mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				items: [{ id: "vid3", snippet: { title: "Video Three" }, statistics: {}, contentDetails: { duration: "PT6M" } }],
			}),
		});
		vi.stubGlobal("fetch", mockFetch);

		const resumeToken = JSON.stringify({ rawPageToken: undefined, leftoverVideoIds: ["vid3"] });

		const { getYoutubeVideosPage } = await importFreshModule();
		const result = await getYoutubeVideosPage({ pageToken: resumeToken, targetCount: 1 });

		expect(result.videos.map((video) => video.videoId)).toEqual(["vid3"]);
		expect(result.nextPageToken).toBeUndefined();
		// Only the leftover video's own details fetch — no raw playlistItems call
		// needed since the leftover alone already satisfies targetCount.
		expect(mockFetch).toHaveBeenCalledTimes(1);
		expect(mockFetch).toHaveBeenCalledWith(
			expect.stringContaining("/videos?"),
			expect.any(Object),
		);
	});

	it("walks a second raw page when the first doesn't have enough videos over minDurationSeconds", async () => {
		setYoutubeEnv();
		process.env.YOUTUBE_PLAYLIST_ID = "UU_test_uploads";

		const mockFetch = vi.fn()
			// Raw page 1: 2 items, but one is a Short (<=60s) — only 1 qualifies.
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					items: [{ contentDetails: { videoId: "vid1" } }, { contentDetails: { videoId: "vid2" } }],
					nextPageToken: "page-2-token",
				}),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					items: [
						{ id: "vid1", snippet: { title: "Regular Video" }, statistics: {}, contentDetails: { duration: "PT4M" } },
						{ id: "vid2", snippet: { title: "A Short" }, statistics: {}, contentDetails: { duration: "PT30S" } },
					],
				}),
			})
			// Raw page 2: 1 more qualifying video, reaching targetCount of 2.
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ items: [{ contentDetails: { videoId: "vid3" } }] }),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					items: [{ id: "vid3", snippet: { title: "Another Regular Video" }, statistics: {}, contentDetails: { duration: "PT3M" } }],
				}),
			});
		vi.stubGlobal("fetch", mockFetch);

		const { getYoutubeVideosPage } = await importFreshModule();
		const result = await getYoutubeVideosPage({ targetCount: 2, minDurationSeconds: 60 });

		expect(result.videos.map((video) => video.videoId)).toEqual(["vid1", "vid3"]);
		expect(result.nextPageToken).toBeUndefined();
		expect(mockFetch).toHaveBeenCalledTimes(4);
		expect(mockFetch).toHaveBeenNthCalledWith(
			3,
			expect.stringContaining("pageToken=page-2-token"),
			expect.any(Object),
		);
	});

	it("stops once the catalog is exhausted, even under targetCount", async () => {
		setYoutubeEnv();
		process.env.YOUTUBE_PLAYLIST_ID = "UU_test_uploads";

		const mockFetch = vi.fn()
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ items: [{ contentDetails: { videoId: "vid1" } }] }),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					items: [{ id: "vid1", snippet: { title: "Only Video" }, statistics: {}, contentDetails: { duration: "PT4M" } }],
				}),
			});
		vi.stubGlobal("fetch", mockFetch);

		const { getYoutubeVideosPage } = await importFreshModule();
		const result = await getYoutubeVideosPage({ targetCount: 50, minDurationSeconds: 60 });

		expect(result.videos).toHaveLength(1);
		expect(result.nextPageToken).toBeUndefined();
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it("throws when required env vars are missing", async () => {
		delete process.env.YOUTUBE_API_BASE_URL;
		delete process.env.YOUTUBE_KEY;
		delete process.env.YOUTUBE_CHANNEL_ID;

		const { getYoutubeVideosPage } = await importFreshModule();

		await expect(getYoutubeVideosPage({ targetCount: 10 })).rejects.toThrow(
			"Missing YouTube environment variables",
		);
	});
});

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Count Formatting XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

describe("formatCount", () => {
	it.each([
		["500", "500"],
		["1500", "1.5K"],
		["12500", "12.5K"],
		["2500000", "2.5M"],
	])("formats %s as %s", async (value, expected) => {
		const { formatCount } = await importFreshModule();

		expect(formatCount(value)).toBe(expected);
	});

	it("returns the raw value when it isn't a valid number", async () => {
		const { formatCount } = await importFreshModule();

		expect(formatCount("not-a-number")).toBe("not-a-number");
	});
});

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX ISO 8601 Duration XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

describe("iso8601DurationToSeconds", () => {
	it.each([
		["PT1M30S", 90],
		["PT45S", 45],
		["PT1H2M3S", 3723],
		["PT10M", 600],
		["PT2H", 7200],
		["PT0S", 0],
	])("converts %s to %i seconds", async (duration, expectedSeconds) => {
		const { iso8601DurationToSeconds } = await importFreshModule();

		expect(iso8601DurationToSeconds(duration)).toBe(expectedSeconds);
	});

	it("returns 0 for an unparseable duration", async () => {
		const { iso8601DurationToSeconds } = await importFreshModule();

		expect(iso8601DurationToSeconds("not-a-duration")).toBe(0);
	});
});

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Video Slug Building XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

describe("buildVideoSlug", () => {
	it("slugifies the title and appends the video ID", async () => {
		const { buildVideoSlug } = await importFreshModule();

		expect(buildVideoSlug("FUNNIEST POSTS ON THE INTERNET?! | EP 627", "RQlRGCrzCEY"))
			.toBe("funniest-posts-on-the-internet-ep-627-RQlRGCrzCEY");
	});

	it("collapses whitespace and strips punctuation", async () => {
		const { buildVideoSlug } = await importFreshModule();

		expect(buildVideoSlug("  Hello,   World!!  ", "vid1")).toBe("hello-world-vid1");
	});

	it("falls back to the bare video ID when the title has no slug-able characters", async () => {
		const { buildVideoSlug } = await importFreshModule();

		expect(buildVideoSlug("???!!!", "vid1")).toBe("vid1");
	});

	it("falls back to the bare video ID for an empty title", async () => {
		const { buildVideoSlug } = await importFreshModule();

		expect(buildVideoSlug("", "vid1")).toBe("vid1");
	});
});

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Video ID From Slug XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

describe("getVideoIdFromSlug", () => {
	it("recovers the video ID from a full title+ID slug", async () => {
		const { getVideoIdFromSlug } = await importFreshModule();

		expect(getVideoIdFromSlug("funniest-posts-on-the-internet-ep-627-RQlRGCrzCEY")).toBe("RQlRGCrzCEY");
	});

	it("returns a bare 11-character video ID unchanged — backward compatible with old links", async () => {
		const { getVideoIdFromSlug } = await importFreshModule();

		expect(getVideoIdFromSlug("RQlRGCrzCEY")).toBe("RQlRGCrzCEY");
	});

	it("returns undefined for a string shorter than a video ID", async () => {
		const { getVideoIdFromSlug } = await importFreshModule();

		expect(getVideoIdFromSlug("too-short")).toBeUndefined();
	});
});
