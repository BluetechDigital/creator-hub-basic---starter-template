import { describe, it, expect, afterEach, vi } from "vitest";

/* -----------------------------------------------------------------------------
Module reads EDGE_CONFIG / VERCEL_* / INSTAGRAM_ACCESS_TOKEN into module-scope
consts on import — set process.env first, then import a fresh copy.
----------------------------------------------------------------------------- */

const originalEnv = { ...process.env };

const EDGE_CONN = "https://edge-config.vercel.com/ecfg_test?token=readtok";

const importFresh = async () => {
	vi.resetModules();
	return import("./instagramToken");
};

const clearEnv = () => {
	delete process.env.EDGE_CONFIG;
	delete process.env.GLOBAL_CONFIG;
	delete process.env.VERCEL_API_TOKEN;
	delete process.env.VERCEL_TEAM_ID;
	delete process.env.INSTAGRAM_ACCESS_TOKEN;
};

describe("getInstagramToken", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("returns the env var when Edge Config is not configured", async () => {
		clearEnv();
		process.env.INSTAGRAM_ACCESS_TOKEN = "env-token";

		const { getInstagramToken } = await importFresh();
		expect(await getInstagramToken()).toBe("env-token");
	});

	it("returns the Edge Config value when present", async () => {
		clearEnv();
		process.env.EDGE_CONFIG = EDGE_CONN;
		process.env.INSTAGRAM_ACCESS_TOKEN = "env-token";

		const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => "edge-token" });
		vi.stubGlobal("fetch", mockFetch);

		const { getInstagramToken } = await importFresh();
		expect(await getInstagramToken()).toBe("edge-token");
		expect(mockFetch).toHaveBeenCalledWith(
			"https://edge-config.vercel.com/ecfg_test/item/instagramAccessToken?token=readtok",
			expect.any(Object),
		);
	});

	it("also reads the connection string from GLOBAL_CONFIG", async () => {
		clearEnv();
		process.env.GLOBAL_CONFIG = EDGE_CONN;

		const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => "edge-token" });
		vi.stubGlobal("fetch", mockFetch);

		const { getInstagramToken } = await importFresh();
		expect(await getInstagramToken()).toBe("edge-token");
	});

	it("falls back to the env var when the Edge Config item is missing (404)", async () => {
		clearEnv();
		process.env.EDGE_CONFIG = EDGE_CONN;
		process.env.INSTAGRAM_ACCESS_TOKEN = "env-token";

		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) }));

		const { getInstagramToken } = await importFresh();
		expect(await getInstagramToken()).toBe("env-token");
	});

	it("falls back to the env var when the Edge Config read throws", async () => {
		clearEnv();
		process.env.EDGE_CONFIG = EDGE_CONN;
		process.env.INSTAGRAM_ACCESS_TOKEN = "env-token";

		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

		const { getInstagramToken } = await importFresh();
		expect(await getInstagramToken()).toBe("env-token");
	});

	it("returns undefined when nothing is configured", async () => {
		clearEnv();
		const { getInstagramToken } = await importFresh();
		expect(await getInstagramToken()).toBeUndefined();
	});
});

describe("persistInstagramToken", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("returns false without writing when credentials are missing", async () => {
		clearEnv();
		const mockFetch = vi.fn();
		vi.stubGlobal("fetch", mockFetch);

		const { persistInstagramToken } = await importFresh();
		expect(await persistInstagramToken("new-token")).toBe(false);
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it("PATCHes the Edge Config item and returns true on success", async () => {
		clearEnv();
		process.env.EDGE_CONFIG = EDGE_CONN;
		process.env.VERCEL_API_TOKEN = "vercel-tok";
		process.env.VERCEL_TEAM_ID = "team_1";

		const mockFetch = vi.fn().mockResolvedValue({ ok: true, text: async () => "{}" });
		vi.stubGlobal("fetch", mockFetch);

		const { persistInstagramToken } = await importFresh();
		expect(await persistInstagramToken("new-token")).toBe(true);

		const [url, init] = mockFetch.mock.calls[0];
		expect(String(url)).toBe("https://api.vercel.com/v1/edge-config/ecfg_test/items?teamId=team_1");
		expect(init.method).toBe("PATCH");
		expect(init.headers.Authorization).toBe("Bearer vercel-tok");
		expect(JSON.parse(init.body)).toEqual({
			items: [{ operation: "upsert", key: "instagramAccessToken", value: "new-token" }],
		});
	});

	it("returns false when the write API responds non-OK", async () => {
		clearEnv();
		process.env.EDGE_CONFIG = EDGE_CONN;
		process.env.VERCEL_API_TOKEN = "vercel-tok";

		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403, text: async () => "forbidden" }));

		const { persistInstagramToken } = await importFresh();
		expect(await persistInstagramToken("new-token")).toBe(false);
	});
});
