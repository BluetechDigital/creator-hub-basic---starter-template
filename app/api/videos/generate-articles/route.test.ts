import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockGetAllYoutubeVideos, mockGetVideoTranscript, mockGenerateArticle, mockVideoArticleExists, mockCreateDraft } =
	vi.hoisted(() => ({
		mockGetAllYoutubeVideos: vi.fn(),
		mockGetVideoTranscript: vi.fn(),
		mockGenerateArticle: vi.fn(),
		mockVideoArticleExists: vi.fn(),
		mockCreateDraft: vi.fn(),
	}));

vi.mock("@/api/YouTube/GetAllYoutubeContent", () => ({
	getAllYoutubeVideos: mockGetAllYoutubeVideos,
}));

vi.mock("@/api/YouTube/GetVideoCaptions", () => ({
	getVideoTranscript: mockGetVideoTranscript,
}));

vi.mock("@/api/Anthropic/GenerateVideoArticle", () => ({
	generateArticleFromTranscript: mockGenerateArticle,
}));

vi.mock("@/api/WordPress/CreateVideoArticleDraft", () => ({
	videoArticleExists: mockVideoArticleExists,
	createVideoArticleDraft: mockCreateDraft,
}));

import { GET } from "./route";

const originalEnv = { ...process.env };

const req = (auth?: string) =>
	new Request("https://example.test/api/videos/generate-articles", {
		headers: auth ? { authorization: auth } : {},
	});

const makeVideo = (id: string, title: string) => ({
	videoId: id,
	snippet: { title },
});

describe("GET /api/videos/generate-articles", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.CRON_SECRET = "s3cret";
		delete process.env.VIDEO_ARTICLE_MAX_PER_RUN;

		mockGetAllYoutubeVideos.mockResolvedValue([makeVideo("vid1", "Video One"), makeVideo("vid2", "Video Two")]);
		mockVideoArticleExists.mockResolvedValue(false);
		mockGetVideoTranscript.mockResolvedValue("a full transcript");
		mockGenerateArticle.mockResolvedValue({ title: "Rewritten Title", contentHtml: "<p>Body</p>" });
		mockCreateDraft.mockResolvedValue({ success: true });
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it("rejects a request without the cron bearer token", async () => {
		const res = await GET(req());
		expect(res.status).toBe(401);
		expect(mockGetAllYoutubeVideos).not.toHaveBeenCalled();
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

	it("502s when fetching the channel's videos fails", async () => {
		mockGetAllYoutubeVideos.mockRejectedValue(new Error("YouTube API down"));
		const res = await GET(req("Bearer s3cret"));
		expect(res.status).toBe(502);
	});

	it("creates a draft for every new video and reports counts", async () => {
		const res = await GET(req("Bearer s3cret"));
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body).toEqual({ ok: true, processed: 2, created: 2, skipped: 0, failed: 0 });
		expect(mockCreateDraft).toHaveBeenCalledTimes(2);
		expect(mockCreateDraft).toHaveBeenCalledWith({
			videoId: "vid1",
			title: "Rewritten Title",
			contentHtml: "<p>Body</p>",
		});
	});

	it("respects VIDEO_ARTICLE_MAX_PER_RUN, ignoring videos beyond the cap", async () => {
		process.env.VIDEO_ARTICLE_MAX_PER_RUN = "1";
		mockGetAllYoutubeVideos.mockResolvedValue([
			makeVideo("vid1", "Video One"),
			makeVideo("vid2", "Video Two"),
			makeVideo("vid3", "Video Three"),
		]);

		const res = await GET(req("Bearer s3cret"));
		const body = await res.json();

		expect(body.processed).toBe(1);
		expect(mockGetVideoTranscript).toHaveBeenCalledTimes(1);
		expect(mockGetVideoTranscript).toHaveBeenCalledWith("vid1");
	});

	it("skips a video that already has an article", async () => {
		mockVideoArticleExists.mockImplementation(async (videoId: string) => videoId === "vid1");

		const res = await GET(req("Bearer s3cret"));
		const body = await res.json();

		expect(body).toEqual({ ok: true, processed: 2, created: 1, skipped: 1, failed: 0 });
		expect(mockGetVideoTranscript).toHaveBeenCalledTimes(1);
		expect(mockGetVideoTranscript).toHaveBeenCalledWith("vid2");
	});

	it("skips a video with no available transcript", async () => {
		mockGetVideoTranscript.mockImplementation(async (videoId: string) =>
			videoId === "vid1" ? undefined : "a full transcript",
		);

		const res = await GET(req("Bearer s3cret"));
		const body = await res.json();

		expect(body).toEqual({ ok: true, processed: 2, created: 1, skipped: 1, failed: 0 });
		expect(mockGenerateArticle).toHaveBeenCalledTimes(1);
	});

	it("counts a video as failed when article generation returns undefined", async () => {
		mockGenerateArticle.mockImplementation(async (_transcript: string, videoTitle: string) =>
			videoTitle === "Video One" ? undefined : { title: "Rewritten Title", contentHtml: "<p>Body</p>" },
		);

		const res = await GET(req("Bearer s3cret"));
		const body = await res.json();

		expect(body).toEqual({ ok: true, processed: 2, created: 1, skipped: 0, failed: 1 });
		expect(mockCreateDraft).toHaveBeenCalledTimes(1);
	});

	it("isolates a per-video failure — one throwing video doesn't stop the rest", async () => {
		mockVideoArticleExists.mockImplementation(async (videoId: string) => {
			if (videoId === "vid1") throw new Error("WordPress REST API error (500)");
			return false;
		});

		const res = await GET(req("Bearer s3cret"));
		const body = await res.json();

		expect(body).toEqual({ ok: true, processed: 2, created: 1, skipped: 0, failed: 1 });
	});

	it("never includes transcript or article text in the response body", async () => {
		mockGetVideoTranscript.mockResolvedValue("SENSITIVE TRANSCRIPT TEXT");
		mockGenerateArticle.mockResolvedValue({ title: "Rewritten Title", contentHtml: "<p>SENSITIVE BODY</p>" });

		const res = await GET(req("Bearer s3cret"));
		const bodyText = JSON.stringify(await res.json());

		expect(bodyText).not.toContain("SENSITIVE TRANSCRIPT TEXT");
		expect(bodyText).not.toContain("SENSITIVE BODY");
	});
});
