import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockRefresh, mockGetToken, mockPersist } = vi.hoisted(() => ({
	mockRefresh: vi.fn(),
	mockGetToken: vi.fn(),
	mockPersist: vi.fn(),
}));

vi.mock("@/api/Instagram/GetAllInstagramFeedContent", () => ({
	refreshInstagramAccessToken: mockRefresh,
}));

vi.mock("@/config/instagramToken", () => ({
	getInstagramToken: mockGetToken,
	persistInstagramToken: mockPersist,
}));

vi.mock("next/cache", () => ({
	revalidateTag: vi.fn(),
}));

import { GET } from "./route";

const originalEnv = { ...process.env };

const req = (auth?: string) =>
	new Request("https://example.test/api/instagram/refresh-token", {
		headers: auth ? { authorization: auth } : {},
	});

describe("GET /api/instagram/refresh-token", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.CRON_SECRET = "s3cret";
		mockGetToken.mockResolvedValue("current-token");
		mockRefresh.mockResolvedValue({ accessToken: "new-token", expiresAt: new Date("2026-11-07T00:00:00Z") });
		mockPersist.mockResolvedValue(true);
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it("rejects a request without the cron bearer token", async () => {
		const res = await GET(req());
		expect(res.status).toBe(401);
		expect(mockRefresh).not.toHaveBeenCalled();
	});

	it("rejects a request with the wrong bearer token", async () => {
		const res = await GET(req("Bearer wrong"));
		expect(res.status).toBe(401);
	});

	it("rejects everything when CRON_SECRET is unset", async () => {
		delete process.env.CRON_SECRET;
		const res = await GET(req("Bearer s3cret"));
		expect(res.status).toBe(401);
	});

	it("500s when no token is configured anywhere", async () => {
		mockGetToken.mockResolvedValue(undefined);
		const res = await GET(req("Bearer s3cret"));
		expect(res.status).toBe(500);
		expect(mockRefresh).not.toHaveBeenCalled();
	});

	it("502s when the refresh call fails", async () => {
		mockRefresh.mockResolvedValue(null);
		const res = await GET(req("Bearer s3cret"));
		expect(res.status).toBe(502);
		expect(mockPersist).not.toHaveBeenCalled();
	});

	it("refreshes the current token and persists the new one", async () => {
		const res = await GET(req("Bearer s3cret"));
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body).toEqual({ ok: true, persisted: true, expiresAt: "2026-11-07T00:00:00.000Z" });
		expect(mockRefresh).toHaveBeenCalledWith("current-token");
		expect(mockPersist).toHaveBeenCalledWith("new-token");
	});

	it("500s (not 200) when the refresh succeeds but the write fails", async () => {
		mockPersist.mockResolvedValue(false);
		const res = await GET(req("Bearer s3cret"));
		const body = await res.json();

		expect(res.status).toBe(500);
		expect(body.persisted).toBe(false);
		expect(body.expiresAt).toBe("2026-11-07T00:00:00.000Z");
	});

	it("never puts the token in the response body", async () => {
		const res = await GET(req("Bearer s3cret"));
		expect(JSON.stringify(await res.json())).not.toContain("new-token");
	});
});
