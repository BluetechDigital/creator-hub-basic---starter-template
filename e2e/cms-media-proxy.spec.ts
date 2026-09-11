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
	// Not just the domain gone — "wp-content/uploads" (the one path segment
	// that unambiguously identifies the CMS as WordPress) is dropped too,
	// while the /2024/ date path underneath it — what actually keeps two
	// same-named uploads from colliding — is kept.
	expect(href).toBe("/api/media/2024/fixture-report.pdf");

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
	expect(decodeURIComponent(src ?? "")).toContain("/api/media/2024/01/photon-photo-scaled.jpg");

	const html = await page.content();
	expect(html).not.toContain("i0.wp.com");
	expect(html).not.toContain(FIXTURE_ORIGIN);
});

test("the proxied document URL actually serves the CMS file", async ({ page }) => {
	const response = await page.request.get("/api/media/2024/fixture-report.pdf");

	expect(response.status()).toBe(200);
	expect(response.headers()["content-type"]).toBe("application/pdf");
	expect(response.headers()["content-disposition"]).toBe("inline");
	expect(await response.text()).toContain("fixture document bytes");
});

// Path-traversal rejection (app/api/media/[...path]/route.test.ts) is
// deliberately NOT re-tested here at the HTTP level: confirmed live, a real
// request for /api/media/../../wp-login.php (both literal and %2e%2e-encoded,
// checked with curl --path-as-is to rule out client-side normalization) never
// reaches this route with literal ".." segments at all — Node's own HTTP
// layer resolves them before Next's router does. That doesn't make the
// application-level guard pointless (it's still what protects a direct
// function call, and there's no guarantee every deployment target normalizes
// identically before request handlers run), but it does mean there's no
// meaningful "hit this exact URL through a browser" scenario left to assert
// on here — the unit test's direct-params-array construction is the only
// thing that can actually exercise the code path this guards.
