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

		describe("Jetpack Photon-wrapped URLs", () => {
			it("unwraps a Photon URL wrapping the configured CMS host, dropping Photon's own query params", async () => {
				process.env.CMS_URL = "https://cbf.example.test";
				const { rewriteCmsMediaUrl } = await importFreshModule();

				expect(
					rewriteCmsMediaUrl("https://i0.wp.com/cbf.example.test/wp-content/uploads/2024/01/photo-scaled.jpg?fit=2560%2C1661&ssl=1"),
				).toBe("/api/media/wp-content/uploads/2024/01/photo-scaled.jpg");
			});

			it("recognizes all four Photon subdomains (i0-i3.wp.com)", async () => {
				process.env.CMS_URL = "https://cbf.example.test";
				const { rewriteCmsMediaUrl } = await importFreshModule();

				for (const sub of ["i0", "i1", "i2", "i3"]) {
					expect(rewriteCmsMediaUrl(`https://${sub}.wp.com/cbf.example.test/wp-content/uploads/x.jpg?ssl=1`))
						.toBe("/api/media/wp-content/uploads/x.jpg");
				}
			});

			it("matches DEV_CMS_URL's host through Photon too", async () => {
				process.env.DEV_CMS_URL = "https://dev-cbf.example.test";
				const { rewriteCmsMediaUrl } = await importFreshModule();

				expect(rewriteCmsMediaUrl("https://i0.wp.com/dev-cbf.example.test/wp-content/uploads/x.jpg?ssl=1"))
					.toBe("/api/media/wp-content/uploads/x.jpg");
			});

			it("leaves a Photon URL wrapping an unrelated site unchanged", async () => {
				process.env.CMS_URL = "https://cbf.example.test";
				const { rewriteCmsMediaUrl } = await importFreshModule();

				const url = "https://i0.wp.com/some-other-wordpress-site.example/wp-content/uploads/x.jpg?ssl=1";
				expect(rewriteCmsMediaUrl(url)).toBe(url);
			});

			it("leaves an i0.wp.com URL that isn't wrapping anything CMS-shaped unchanged", async () => {
				process.env.CMS_URL = "https://cbf.example.test";
				const { rewriteCmsMediaUrl } = await importFreshModule();

				const url = "https://i0.wp.com/some-random-path";
				expect(rewriteCmsMediaUrl(url)).toBe(url);
			});
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

		describe("Jetpack Photon-wrapped URLs", () => {
			it("rewrites a Photon-wrapped <img src>, the exact shape this was found missing for (a homepage FAQ block)", async () => {
				process.env.CMS_URL = "https://cbf.example.test";
				const { rewriteCmsUrlsInHtml } = await importFreshModule();

				const html = '<img src="https://i0.wp.com/cbf.example.test/wp-content/uploads/2024/01/photo-scaled.jpg?fit=2560%2C1661&ssl=1" alt="">';
				expect(rewriteCmsUrlsInHtml(html)).toBe(
					'<img src="/api/media/wp-content/uploads/2024/01/photo-scaled.jpg" alt="">',
				);
			});

			it("rewrites a Photon-wrapped <a href> the same way", async () => {
				process.env.CMS_URL = "https://cbf.example.test";
				const { rewriteCmsUrlsInHtml } = await importFreshModule();

				const html = '<a href="https://i2.wp.com/cbf.example.test/wp-content/uploads/2024/report.pdf?ssl=1">Download</a>';
				expect(rewriteCmsUrlsInHtml(html)).toBe(
					'<a href="/api/media/wp-content/uploads/2024/report.pdf">Download</a>',
				);
			});

			it("handles a mix of direct and Photon-wrapped URLs in the same document", async () => {
				process.env.CMS_URL = "https://cbf.example.test";
				const { rewriteCmsUrlsInHtml } = await importFreshModule();

				const html =
					'<img src="https://cbf.example.test/wp-content/uploads/direct.jpg">' +
					'<img src="https://i0.wp.com/cbf.example.test/wp-content/uploads/photon.jpg?ssl=1">';

				expect(rewriteCmsUrlsInHtml(html)).toBe(
					'<img src="/api/media/wp-content/uploads/direct.jpg">' +
					'<img src="/api/media/wp-content/uploads/photon.jpg">',
				);
			});

			it("leaves a Photon URL wrapping an unrelated site unchanged", async () => {
				process.env.CMS_URL = "https://cbf.example.test";
				const { rewriteCmsUrlsInHtml } = await importFreshModule();

				const html = '<img src="https://i0.wp.com/some-other-site.example/wp-content/uploads/x.jpg?ssl=1">';
				expect(rewriteCmsUrlsInHtml(html)).toBe(html);
			});
		});
	});
});
