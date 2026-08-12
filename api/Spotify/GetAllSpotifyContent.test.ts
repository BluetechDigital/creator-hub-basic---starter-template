import { describe, it, expect, afterEach, vi } from "vitest";

// See api/YouTube/GetAllYoutubeContent.test.ts for why this needs a fresh
// module import per test (env vars are captured into module-scope consts).
const originalEnv = { ...process.env };

const importFreshModule = async () => {
	vi.resetModules();
	return import("./GetAllSpotifyContent");
};

const setSpotifyEnv = () => {
	process.env.SPOTIFY_API_BASE_URL = "https://api.spotify.test/v1";
	process.env.SPOTIFY_SHOW_ID = "show123";
	process.env.SPOTIFY_CLIENT_ID = "client-id";
	process.env.SPOTIFY_CLIENT_SECRET = "client-secret";
};

const tokenResponse = {
	ok: true,
	json: async () => ({ access_token: "token-abc", token_type: "Bearer", expires_in: 3600 }),
};

describe("GetAllSpotifyContent", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("wraps missing Spotify credentials in the access-token error", async () => {
		delete process.env.SPOTIFY_CLIENT_ID;
		delete process.env.SPOTIFY_CLIENT_SECRET;

		const { getAllSpotifyProjectAccessToken } = await importFreshModule();

		// The missing-credentials check is inside the same try/catch as the fetch
		// call, so it surfaces as the generic wrapped message, not its own error —
		// asserting the actual observable message, not the one that gets swallowed.
		await expect(getAllSpotifyProjectAccessToken()).rejects.toThrow(
			"Something went wrong while fetching the Spotify access token",
		);
	});

	it("requests a token using Basic auth built from the client credentials", async () => {
		setSpotifyEnv();

		const mockFetch = vi.fn().mockResolvedValue(tokenResponse);
		vi.stubGlobal("fetch", mockFetch);

		const { getAllSpotifyProjectAccessToken } = await importFreshModule();
		const token = await getAllSpotifyProjectAccessToken();

		expect(token).toBe("token-abc");

		const [url, init] = mockFetch.mock.calls[0];
		expect(url).toBe("https://accounts.spotify.com/api/token");
		expect(init.headers.Authorization).toBe(
			`Basic ${Buffer.from("client-id:client-secret").toString("base64")}`,
		);
	});

	it("paginates episodes across pages and stops once 100 episodes are collected", async () => {
		setSpotifyEnv();

		const page = (items: { id: string }[], next: string | null) => ({
			ok: true,
			json: async () => ({ items, next }),
		});

		const mockFetch = vi
			.fn()
			.mockResolvedValueOnce(tokenResponse)
			.mockResolvedValueOnce(
				page(
					Array.from({ length: 50 }, (_, i) => ({ id: `ep-${i}` })),
					"https://api.spotify.test/v1/shows/show123/episodes?offset=50",
				),
			)
			.mockResolvedValueOnce(
				page(
					Array.from({ length: 50 }, (_, i) => ({ id: `ep-${50 + i}` })),
					null,
				),
			);
		vi.stubGlobal("fetch", mockFetch);

		const { getAllSpotifyPodcastEpisodes } = await importFreshModule();
		const episodes = await getAllSpotifyPodcastEpisodes();

		expect(episodes).toHaveLength(100);
		expect(mockFetch).toHaveBeenCalledTimes(3); // token exchange + 2 pages
	});

	it("stops paginating once the 100-episode cap is hit, even if more pages exist", async () => {
		setSpotifyEnv();

		const page = (items: { id: string }[], next: string | null) => ({
			ok: true,
			json: async () => ({ items, next }),
		});

		const mockFetch = vi
			.fn()
			.mockResolvedValueOnce(tokenResponse)
			.mockResolvedValueOnce(
				page(
					Array.from({ length: 100 }, (_, i) => ({ id: `ep-${i}` })),
					"https://api.spotify.test/v1/shows/show123/episodes?offset=100",
				),
			);
		vi.stubGlobal("fetch", mockFetch);

		const { getAllSpotifyPodcastEpisodes } = await importFreshModule();
		const episodes = await getAllSpotifyPodcastEpisodes();

		expect(episodes).toHaveLength(100);
		expect(mockFetch).toHaveBeenCalledTimes(2); // token exchange + 1 page — never fetches the 3rd
	});
});
