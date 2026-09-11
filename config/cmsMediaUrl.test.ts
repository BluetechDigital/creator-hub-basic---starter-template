import { describe, it, expect, afterEach, vi } from "vitest";

/* -----------------------------------------------------------------------------
CMS_URL/DEV_CMS_URL are read into module-scope consts on import, not re-read
per call — see api/YouTube/GetAllYoutubeContent.test.ts's doc comment for why
that means each test needs a fresh module import after setting process.env.
----------------------------------------------------------------------------- */

const originalEnv = { ...process.env };

const importFreshModule = async () => {
	vi.resetModules();
	return import("./cmsMediaUrl");
};

describe("cmsMediaUrl", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
	});

	describe("rewriteCmsMediaUrl", () => {
		it("rewrites a CMS_URL-origin URL to a same-origin /api/media path", async () => {
			process.env.CMS_URL = "https://cms.example.test";
			const { rewriteCmsMediaUrl } = await importFreshModule();

			expect(rewriteCmsMediaUrl("https://cms.example.test/wp-content/uploads/2024/example.pdf"))
				.toBe("/api/media/wp-content/uploads/2024/example.pdf");
		});

		it("rewrites a DEV_CMS_URL-origin URL the same way", async () => {
			process.env.DEV_CMS_URL = "https://dev-cms.example.test";
			const { rewriteCmsMediaUrl } = await importFreshModule();

			expect(rewriteCmsMediaUrl("https://dev-cms.example.test/wp-content/uploads/x.png"))
				.toBe("/api/media/wp-content/uploads/x.png");
		});

		it("leaves a non-CMS URL (an external image, a Gravatar avatar) unchanged", async () => {
			process.env.CMS_URL = "https://cms.example.test";
			const { rewriteCmsMediaUrl } = await importFreshModule();

			const gravatar = "https://secure.gravatar.com/avatar/abc123";
			expect(rewriteCmsMediaUrl(gravatar)).toBe(gravatar);
		});

		it("passes null/undefined/empty through unchanged", async () => {
			process.env.CMS_URL = "https://cms.example.test";
			const { rewriteCmsMediaUrl } = await importFreshModule();

			expect(rewriteCmsMediaUrl(null)).toBeNull();
			expect(rewriteCmsMediaUrl(undefined)).toBeUndefined();
			expect(rewriteCmsMediaUrl("")).toBe("");
		});

		it("is a no-op when neither CMS_URL nor DEV_CMS_URL is set", async () => {
			delete process.env.CMS_URL;
			delete process.env.DEV_CMS_URL;
			const { rewriteCmsMediaUrl } = await importFreshModule();

			const url = "https://cms.example.test/wp-content/uploads/x.png";
			expect(rewriteCmsMediaUrl(url)).toBe(url);
		});
	});

	describe("rewriteCmsUrlsInHtml", () => {
		it("rewrites an <img src> pointing at the CMS", async () => {
			process.env.CMS_URL = "https://cms.example.test";
			const { rewriteCmsUrlsInHtml } = await importFreshModule();

			const html = '<p><img src="https://cms.example.test/wp-content/uploads/photo.jpg" alt=""></p>';
			expect(rewriteCmsUrlsInHtml(html)).toBe(
				'<p><img src="/api/media/wp-content/uploads/photo.jpg" alt=""></p>',
			);
		});

		it("rewrites an <a href> document link pointing at the CMS", async () => {
			process.env.CMS_URL = "https://cms.example.test";
			const { rewriteCmsUrlsInHtml } = await importFreshModule();

			const html = '<a href="https://cms.example.test/wp-content/uploads/2024/report.pdf">Download</a>';
			expect(rewriteCmsUrlsInHtml(html)).toBe(
				'<a href="/api/media/wp-content/uploads/2024/report.pdf">Download</a>',
			);
		});

		it("rewrites multiple occurrences in the same document", async () => {
			process.env.CMS_URL = "https://cms.example.test";
			const { rewriteCmsUrlsInHtml } = await importFreshModule();

			const html =
				'<img src="https://cms.example.test/wp-content/uploads/a.jpg">' +
				'<img src="https://cms.example.test/wp-content/uploads/b.jpg">';

			expect(rewriteCmsUrlsInHtml(html)).toBe(
				'<img src="/api/media/wp-content/uploads/a.jpg">' +
				'<img src="/api/media/wp-content/uploads/b.jpg">',
			);
		});

		it("leaves markup with no CMS-origin URLs unchanged", async () => {
			process.env.CMS_URL = "https://cms.example.test";
			const { rewriteCmsUrlsInHtml } = await importFreshModule();

			const html = '<p>Plain text</p><a href="https://external.example.com/doc.pdf">External</a>';
			expect(rewriteCmsUrlsInHtml(html)).toBe(html);
		});

		it("handles empty/undefined input", async () => {
			process.env.CMS_URL = "https://cms.example.test";
			const { rewriteCmsUrlsInHtml } = await importFreshModule();

			expect(rewriteCmsUrlsInHtml("")).toBe("");
			expect(rewriteCmsUrlsInHtml(undefined)).toBe("");
		});

		it("is a no-op when neither CMS_URL nor DEV_CMS_URL is set", async () => {
			delete process.env.CMS_URL;
			delete process.env.DEV_CMS_URL;
			const { rewriteCmsUrlsInHtml } = await importFreshModule();

			const html = '<img src="https://cms.example.test/wp-content/uploads/a.jpg">';
			expect(rewriteCmsUrlsInHtml(html)).toBe(html);
		});
	});
});
