import { describe, it, expect, afterEach, vi } from "vitest";

const originalEnv = { ...process.env };

const importFreshModule = async () => {
	vi.resetModules();
	return import("./CreateVideoArticleDraft");
};

const setCmsEnv = () => {
	process.env.CMS_URL = "https://example.test";
	process.env.WP_APPLICATION_USERNAME = "creator";
	process.env.WP_APPLICATION_PASSWORD = "app-pass";
};

describe("buildVideoArticleSlug", () => {
	it("prefixes the video id with a fixed marker", async () => {
		const { buildVideoArticleSlug } = await importFreshModule();
		expect(buildVideoArticleSlug("RQlRGCrzCEY")).toBe("video-article-RQlRGCrzCEY");
	});
});

describe("isVideoArticleSlug", () => {
	it("returns true for a slug built by buildVideoArticleSlug", async () => {
		const { buildVideoArticleSlug, isVideoArticleSlug } = await importFreshModule();
		expect(isVideoArticleSlug(buildVideoArticleSlug("RQlRGCrzCEY"))).toBe(true);
	});

	it("returns false for an ordinary post slug", async () => {
		const { isVideoArticleSlug } = await importFreshModule();
		expect(isVideoArticleSlug("how-we-built-ai-collections")).toBe(false);
	});

	it("returns false for a slug that merely contains the marker, not at the start", async () => {
		const { isVideoArticleSlug } = await importFreshModule();
		expect(isVideoArticleSlug("my-video-article-review")).toBe(false);
	});
});

describe("videoArticleExists", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("throws when CMS_URL is missing", async () => {
		delete process.env.CMS_URL;
		const { videoArticleExists } = await importFreshModule();

		await expect(videoArticleExists("abc")).rejects.toThrow("CMS_URL not defined.");
	});

	it("queries by the deterministic slug with status=any, authenticated", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
		vi.stubGlobal("fetch", mockFetch);

		const { videoArticleExists } = await importFreshModule();
		await videoArticleExists("RQlRGCrzCEY");

		const [url, init] = mockFetch.mock.calls[0];
		expect(String(url)).toBe("https://example.test/wp-json/wp/v2/posts?slug=video-article-RQlRGCrzCEY&status=any");
		expect((init as RequestInit).headers).toHaveProperty("Authorization");
	});

	it("returns true when a matching post is found", async () => {
		setCmsEnv();
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [{ id: 1 }] }));

		const { videoArticleExists } = await importFreshModule();
		expect(await videoArticleExists("RQlRGCrzCEY")).toBe(true);
	});

	it("returns false when no post matches", async () => {
		setCmsEnv();
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));

		const { videoArticleExists } = await importFreshModule();
		expect(await videoArticleExists("RQlRGCrzCEY")).toBe(false);
	});

	it("throws when the response is not ok", async () => {
		setCmsEnv();
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));

		const { videoArticleExists } = await importFreshModule();
		await expect(videoArticleExists("RQlRGCrzCEY")).rejects.toThrow(/401/);
	});
});

describe("createVideoArticleDraft", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("throws when CMS_URL is missing", async () => {
		delete process.env.CMS_URL;
		const { createVideoArticleDraft } = await importFreshModule();

		await expect(
			createVideoArticleDraft({ videoId: "abc", title: "Title", contentHtml: "<p>Body</p>" }),
		).rejects.toThrow("CMS_URL not defined.");
	});

	it("POSTs a draft with the deterministic slug and no category when unset", async () => {
		setCmsEnv();
		delete process.env.WP_VIDEO_ARTICLE_CATEGORY_ID;

		const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 42 }) });
		vi.stubGlobal("fetch", mockFetch);

		const { createVideoArticleDraft } = await importFreshModule();
		const result = await createVideoArticleDraft({
			videoId: "RQlRGCrzCEY",
			title: "How To Do The Thing",
			contentHtml: "<p>Body</p>",
		});

		expect(result).toEqual({ success: true });

		const [url, init] = mockFetch.mock.calls[0];
		expect(String(url)).toBe("https://example.test/wp-json/wp/v2/posts");
		expect((init as RequestInit).method).toBe("POST");

		const body = JSON.parse((init as RequestInit).body as string);
		expect(body).toEqual({
			title: "How To Do The Thing",
			slug: "video-article-RQlRGCrzCEY",
			content: "<p>Body</p>",
			status: "draft",
		});
	});

	it("includes the configured category id when set", async () => {
		setCmsEnv();
		process.env.WP_VIDEO_ARTICLE_CATEGORY_ID = "7";

		const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 42 }) });
		vi.stubGlobal("fetch", mockFetch);

		const { createVideoArticleDraft } = await importFreshModule();
		await createVideoArticleDraft({ videoId: "RQlRGCrzCEY", title: "Title", contentHtml: "<p>Body</p>" });

		const [, init] = mockFetch.mock.calls[0];
		const body = JSON.parse((init as RequestInit).body as string);
		expect(body.categories).toEqual([7]);
	});

	it("throws (with the response body) when WordPress rejects the write", async () => {
		setCmsEnv();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({ ok: false, status: 403, text: async () => "rest_cannot_create" }),
		);

		const { createVideoArticleDraft } = await importFreshModule();

		await expect(
			createVideoArticleDraft({ videoId: "abc", title: "Title", contentHtml: "<p>Body</p>" }),
		).rejects.toThrow(/403/);
	});
});
