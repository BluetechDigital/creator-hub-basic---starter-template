import { describe, it, expect, afterEach, vi } from "vitest";

const originalEnv = { ...process.env };

const importFresh = async () => {
	vi.resetModules();
	return import("./youtubeOAuth");
};

const setEnv = () => {
	process.env.YOUTUBE_OAUTH_CLIENT_ID = "client-id";
	process.env.YOUTUBE_OAUTH_CLIENT_SECRET = "client-secret";
	process.env.YOUTUBE_OAUTH_REFRESH_TOKEN = "refresh-token";
};

describe("getYoutubeAccessToken", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("throws when any OAuth env var is missing", async () => {
		delete process.env.YOUTUBE_OAUTH_CLIENT_ID;
		delete process.env.YOUTUBE_OAUTH_CLIENT_SECRET;
		delete process.env.YOUTUBE_OAUTH_REFRESH_TOKEN;

		const { getYoutubeAccessToken } = await importFresh();
		await expect(getYoutubeAccessToken()).rejects.toThrow("Missing YouTube OAuth environment variables");
	});

	it("exchanges the refresh token for an access token via Google's token endpoint", async () => {
		setEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ access_token: "ya29.fresh-token", expires_in: 3600, token_type: "Bearer" }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getYoutubeAccessToken } = await importFresh();
		const token = await getYoutubeAccessToken();

		expect(token).toBe("ya29.fresh-token");

		const [url, init] = mockFetch.mock.calls[0];
		expect(String(url)).toBe("https://oauth2.googleapis.com/token");
		expect((init as RequestInit).method).toBe("POST");

		const params = new URLSearchParams((init as RequestInit).body as string);
		expect(params.get("client_id")).toBe("client-id");
		expect(params.get("client_secret")).toBe("client-secret");
		expect(params.get("refresh_token")).toBe("refresh-token");
		expect(params.get("grant_type")).toBe("refresh_token");
	});

	it("throws when Google rejects the exchange", async () => {
		setEnv();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({ ok: false, status: 400, text: async () => "invalid_grant" }),
		);

		const { getYoutubeAccessToken } = await importFresh();
		await expect(getYoutubeAccessToken()).rejects.toThrow(/400/);
	});
});
