/* -----------------------------------------------------------------------------
Lean route/SEO smoke suite: every core route actually renders (200, no console
error, no React/Next dev error overlay) against the fixture backend, and the
generated /robots.txt + /sitemap.xml are well-formed.
----------------------------------------------------------------------------- */

import { test, expect } from "./support/fixtures";

const CORE_ROUTES = [
	"/en",
	"/en/test-page",
	"/en/posts",
	"/en/posts/first-fixture-post",
	"/en/videos",
	"/en/contact",
];

for (const route of CORE_ROUTES) {
	test(`${route} renders cleanly`, async ({ page }) => {
		// Next dev always renders a <nextjs-portal> custom element (its dev-tools
		// indicator badge), so its mere presence doesn't mean anything crashed —
		// an uncaught exception (`pageerror`) is the actual "this route broke"
		// signal.
		const pageErrors: string[] = [];
		page.on("pageerror", (error) => pageErrors.push(error.message));

		const response = await page.goto(route);
		expect(response?.status()).toBe(200);
		expect(pageErrors).toEqual([]);
	});
}

test("/robots.txt is plain text, points at the sitemap, and allows crawling", async ({ page }) => {
	const response = await page.goto("/robots.txt");
	expect(response?.headers()["content-type"]).toContain("text/plain");

	const body = await response!.text();
	expect(body).toContain("Allow: /");
	expect(body).toContain("Disallow: /private/");
	expect(body).toContain("Sitemap: http://localhost:3000/sitemap.xml");
});

test("/sitemap.xml is well-formed and lists the fixture pages/posts with hreflang alternates", async ({ page }) => {
	const response = await page.goto("/sitemap.xml");
	expect(response?.headers()["content-type"]).toContain("xml");

	const body = await response!.text();
	expect(body.startsWith("<?xml")).toBe(true);

	// The fixture pages/posts (see e2e/fixtures/data.mjs's PAGE_SLUGS/POST_SLUGS)
	// each appear as a canonical (English, un-suffixed) <loc>.
	for (const path of ["/en/test-page", "/en/contact", "/en/posts/first-fixture-post"]) {
		expect(body).toContain(`<loc>http://localhost:3000${path}</loc>`);
	}

	// Every entry carries an xhtml:link hreflang alternate for all 6 locales
	// plus x-default (buildLocaleAlternates — i18n/buildAlternates.ts).
	for (const locale of ["en", "fr", "de", "es", "it", "pt"]) {
		expect(body).toContain(`hreflang="${locale}"`);
	}
	expect(body).toContain('hreflang="x-default"');
});
