/* -----------------------------------------------------------------------------
The CMS-origin masking layer (config/cmsMediaUrl.ts + app/api/media/[...path]/
route.ts): nothing a visitor's browser ever loads should reveal the CMS's real
hostname — not an image `src`, not a document `href`, not page source. The
fixture post's `content` (e2e/fixtures/data.mjs) links directly at the fixture
CMS's own origin specifically so this suite can prove the app never lets that
raw origin reach the page.
----------------------------------------------------------------------------- */

import { test, expect } from "./support/fixtures";
import { FIXTURE_ORIGIN } from "./fixtures/env.mjs";

const POST_URL = "/en/posts/first-fixture-post";

test("a document link rewrites to the same-origin proxy, never the raw CMS origin", async ({ page }) => {
	await page.goto(POST_URL);

	const link = page.getByRole("link", { name: "Download the report" });
	await expect(link).toBeVisible();

	const href = await link.getAttribute("href");
	expect(href).toBe("/api/media/wp-content/uploads/2024/fixture-report.pdf");

	// The strongest version of the assertion: the fixture CMS's own origin
	// (the thing this whole feature exists to hide) doesn't appear anywhere
	// in the rendered page at all, not just in this one link.
	const html = await page.content();
	expect(html).not.toContain(FIXTURE_ORIGIN);
});

test("a Jetpack-Photon-wrapped image also rewrites to the proxy — not just a direct CMS URL", async ({ page }) => {
	// Regression case: WPGraphQL returns image URLs shaped like
	// https://i0.wp.com/<cms-host>/wp-content/uploads/... when Photon/Site
	// Accelerator is on, not ${CMS_URL}/wp-content/uploads/... directly — a
	// plain CMS-origin string match never catches that, and the CMS's real
	// hostname leaked straight through it, embedded in the Photon path.
	await page.goto(POST_URL);

	const image = page.getByRole("img", { name: "A Photon-wrapped photo" });
	await expect(image).toBeVisible();

	const src = await image.getAttribute("src");
	// next/image still runs a local (root-relative) src through its own
	// /_next/image optimizer — asserting the *fixture CMS's* origin is gone
	// is the meaningful check, not asserting an exact optimizer URL shape.
	expect(src).not.toContain("i0.wp.com");
	expect(src).not.toContain(new URL(FIXTURE_ORIGIN).hostname + ":");
	expect(decodeURIComponent(src ?? "")).toContain("/api/media/wp-content/uploads/2024/01/photon-photo-scaled.jpg");

	const html = await page.content();
	expect(html).not.toContain("i0.wp.com");
	expect(html).not.toContain(FIXTURE_ORIGIN);
});

test("the proxied document URL actually serves the CMS file", async ({ page }) => {
	const response = await page.request.get("/api/media/wp-content/uploads/2024/fixture-report.pdf");

	expect(response.status()).toBe(200);
	expect(response.headers()["content-type"]).toBe("application/pdf");
	expect(response.headers()["content-disposition"]).toBe("inline");
	expect(await response.text()).toContain("fixture document bytes");
});

test("the proxy refuses to forward a path outside the WP media library", async ({ page }) => {
	const response = await page.request.get("/api/media/wp-login.php");
	expect(response.status()).toBe(404);
});
