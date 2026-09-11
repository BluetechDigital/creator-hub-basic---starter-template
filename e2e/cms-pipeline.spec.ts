/* -----------------------------------------------------------------------------
The CMS flexible-content pipeline (ARCHITECTURE.md §1): slug -> two-pass
GraphQL query -> RenderFlexibleContent -> DynamicComponentLoaders. Exercises
the actual fixture pages defined in e2e/fixtures/data.mjs's PAGE_BLOCKS.

Does NOT attempt to exercise the null-content regression from this session
(`app/[locale]/page.tsx`'s Home page hands a possibly-null flexible-content
result straight to `RenderFlexibleContent` with no `notFound()` guard, unlike
every other route — see `RenderFlexibleContent.tsx`'s `content ?? []` guard
and its own `RenderFlexibleContent.test.tsx` unit tests, which DO cover this)
live through the browser: every `graphql/CMS/*.ts` call uses
`next: { revalidate: 86400 }`, and Playwright's own webServer readiness probe
(`GET /en`) already warms Next's Data Cache with a real, successful response
for the Home page's queries before any spec runs — a later request for the
exact same query+variables is a legitimate cache hit, so a fixture-side
"return an error for the Home slug" scenario switch has no way to reach a
request that never leaves the cache. Confirmed live: deliberately reverting
the `content ?? []` guard did not make a scenario-based version of this test
fail. The Vitest unit tests are the real regression guard for this one; this
suite covers the parts of the pipeline caching doesn't get in the way of.
----------------------------------------------------------------------------- */

import { test, expect, acceptCookieConsent } from "./support/fixtures";

// Post titles are rendered as headings — matched via that role rather than
// getByText, since a title (e.g. "First fixture post") is also a substring of
// its own excerpt ("Excerpt for the first fixture post.") under Playwright's
// default case-insensitive substring text matching.

test("/en renders the Home fixture's blocks, in order", async ({ page }) => {
	await page.goto("/en");

	await expect(page.getByRole("heading", { name: "Welcome to the Creator Hub" })).toBeVisible();
	await expect(page.getByText("This is the home page introduction, authored in the CMS.")).toBeVisible();

	await expect(page.getByRole("heading", { name: "Latest from the blog" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "First fixture post" })).toBeVisible();
});

test("/en/test-page renders its own TitleParagraph block", async ({ page }) => {
	await page.goto("/en/test-page");

	await expect(page.getByRole("heading", { name: "A generic CMS page" })).toBeVisible();
	await expect(page.getByText("Rendered from ACF flexible-content blocks, no per-page code.")).toBeVisible();
});

test("a GraphQL schema error 404s cleanly instead of crashing", async ({ page }) => {
	// [slug]/page.tsx's DynamicPages treats a null flexible-content result (which
	// is what a GraphQL `errors` response resolves to) as "not found" — see its
	// own doc comment. Confirms the failure surfaces as a clean 404, not a 500
	// or a client-side crash.
	const pageErrors: string[] = [];
	page.on("pageerror", (error) => pageErrors.push(error.message));

	const response = await page.goto("/en/broken-page");
	expect(response?.status()).toBe(404);
	expect(pageErrors).toEqual([]);
});

test("a page with zero flexible-content blocks 404s cleanly instead of rendering blank", async ({ page }) => {
	// Same `[slug]/page.tsx` guard as above: extractActiveComponentNames returns
	// [] for a page with no blocks, so getAllPageACFFlexibleComponentsContent
	// resolves to null there too — a CMS page that genuinely has nothing on it
	// yet 404s rather than silently serving an empty shell.
	const pageErrors: string[] = [];
	page.on("pageerror", (error) => pageErrors.push(error.message));

	const response = await page.goto("/en/empty-page");
	expect(response?.status()).toBe(404);
	expect(pageErrors).toEqual([]);
});

test("/en/posts lists every fixture post", async ({ page }) => {
	await page.goto("/en/posts");

	for (const title of ["First fixture post", "Second fixture post", "Third fixture post", "Fourth fixture post", "Fifth fixture post"]) {
		await expect(page.getByRole("heading", { name: title })).toBeVisible();
	}
});

test("filtering the archive by category re-queries the CMS and narrows the grid", async ({ page, context, graphqlLog }) => {
	await acceptCookieConsent(context);
	await page.goto("/en/posts");
	await expect(page.getByRole("heading", { name: "First fixture post" })).toBeVisible();

	await page.getByRole("combobox", { name: "Filter by category" }).selectOption("news");

	// The category select writes ?category= to the URL and AllBlogPosts (a
	// Server Component) re-fetches on navigation — wait for that URL change
	// rather than a fixed timeout.
	await expect(page).toHaveURL(/category=news/);

	// Only the 3 fixture posts tagged "News" remain.
	await expect(page.getByRole("heading", { name: "First fixture post" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Third fixture post" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Fifth fixture post" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Second fixture post" })).toHaveCount(0);
	await expect(page.getByRole("heading", { name: "Fourth fixture post" })).toHaveCount(0);

	const log = await graphqlLog();
	const lastPostsQuery = [...log].reverse().find((entry) => entry.op === "GetAllPostsSummaries");
	expect(lastPostsQuery?.variables.categoryName).toBe("news");
});
