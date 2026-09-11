/* -----------------------------------------------------------------------------
The single-post comment form (app/[locale]/posts/[slug]/actions.ts's
submitComment Server Action) + the like/dislike EngagementBar. Every test
tags its browser context with a unique `x-forwarded-for` (the `ip` fixture)
so `config/rateLimit.ts`'s per-IP bucket never leaks between tests — except
the rate-limit test itself, which deliberately reuses one IP for 4 submits.
----------------------------------------------------------------------------- */

import { test, expect, acceptCookieConsent } from "./support/fixtures";

const POST_URL = "/en/posts/first-fixture-post";

test.beforeEach(async ({ page, context, ip }) => {
	await page.context().setExtraHTTPHeaders({ "x-forwarded-for": ip });
	await acceptCookieConsent(context);
});

test("a valid comment submits, shows a thanks message, and resets the form", async ({ page, graphqlLog }) => {
	await page.goto(POST_URL);

	await page.getByLabel("Name").fill("Ada Lovelace");
	await page.getByLabel("Email").fill("ada@example.com");
	await page.getByLabel("Comment", { exact: true }).fill("Great write-up, thanks for sharing!");
	await page.getByRole("button", { name: "Post comment" }).click();

	await expect(page.getByRole("status")).toHaveText("Thanks for your comment! It may take a minute to appear.");
	await expect(page.getByLabel("Comment", { exact: true })).toHaveValue("");

	const log = await graphqlLog();
	expect(log.some((entry) => entry.op === "CreateComment")).toBe(true);
});

test("a honeypot-filled submission looks successful but fires no mutation", async ({ page, graphqlLog }) => {
	await page.goto(POST_URL);

	await page.getByLabel("Name").fill("Bot Account");
	await page.getByLabel("Email").fill("bot@example.com");
	await page.getByLabel("Comment", { exact: true }).fill("Buy my stuff");
	await page.locator('input[name="website"]').fill("https://spam.example.com");
	await page.getByRole("button", { name: "Post comment" }).click();

	await expect(page.getByRole("status")).toHaveText("Thanks for your comment! It may take a minute to appear.");

	const log = await graphqlLog();
	expect(log.some((entry) => entry.op === "CreateComment")).toBe(false);
});

test("empty/invalid fields show validation errors and fire no mutation", async ({ page, graphqlLog }) => {
	await page.goto(POST_URL);

	await page.getByLabel("Email").fill("not-an-email");
	await page.getByRole("button", { name: "Post comment" }).click();

	await expect(page.getByText("Please enter your name (2-100 characters).")).toBeVisible();
	await expect(page.getByText("Please enter a valid email address.")).toBeVisible();
	await expect(page.getByText("Please enter a comment (2-5000 characters).")).toBeVisible();

	const log = await graphqlLog();
	expect(log.some((entry) => entry.op === "CreateComment")).toBe(false);
});

test("a 4th rapid submission from the same IP is rate-limited", async ({ page }) => {
	await page.goto(POST_URL);

	for (let i = 1; i <= 3; i++) {
		await page.getByLabel("Name").fill(`Reader ${i}`);
		await page.getByLabel("Email").fill(`reader${i}@example.com`);
		await page.getByLabel("Comment", { exact: true }).fill(`Comment number ${i}.`);
		await page.getByRole("button", { name: "Post comment" }).click();
		await expect(page.getByRole("status")).toHaveText("Thanks for your comment! It may take a minute to appear.");
	}

	await page.getByLabel("Name").fill("Reader 4");
	await page.getByLabel("Email").fill("reader4@example.com");
	await page.getByLabel("Comment", { exact: true }).fill("Comment number 4.");
	await page.getByRole("button", { name: "Post comment" }).click();

	// Not getByRole("alert") — Next's own route-announcer div also carries
	// role="alert" (empty, for screen-reader route-change announcements) and
	// collides with this locator.
	await expect(page.getByText("You're commenting too quickly — please wait a moment and try again.")).toBeVisible();
});

test("like then dislike swap the reaction and update both counts", async ({ page }) => {
	await page.goto(POST_URL);

	const like = page.getByRole("button", { name: "Like this post", exact: true });
	const dislike = page.getByRole("button", { name: "Dislike this post", exact: true });

	await like.click();
	await expect(like).toHaveAttribute("aria-pressed", "true");
	await expect(like.locator("span")).toHaveText("1");

	await dislike.click();
	await expect(dislike).toHaveAttribute("aria-pressed", "true");
	await expect(like).toHaveAttribute("aria-pressed", "false");
});
