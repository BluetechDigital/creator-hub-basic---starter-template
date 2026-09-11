/* -----------------------------------------------------------------------------
The ContactForm CMS block (components/CMS/ContactForm/actions.tsx's
submitContactForm Server Action) — the one flow that touches the fake SMTP
server (e2e/fixtures/server.mjs), so a valid submission is also checked
against /__inbox for the notification + confirmation emails.
----------------------------------------------------------------------------- */

import { test, expect, acceptCookieConsent } from "./support/fixtures";

test.beforeEach(async ({ page, context, ip }) => {
	await page.context().setExtraHTTPHeaders({ "x-forwarded-for": ip });
	await acceptCookieConsent(context);
});

test("a valid submission sends both emails and shows a thanks message", async ({ page, inbox }) => {
	await page.goto("/en/contact");

	await page.getByLabel("Name").fill("Grace Hopper");
	await page.getByLabel("Email").fill("grace@example.com");
	await page.getByLabel("Message").fill("Hello, I'd like to know more about Creator Hub Basic.");
	await page.getByRole("button", { name: "Send message" }).click();

	await expect(page.getByRole("status")).toHaveText("Thanks — your message has been sent.");

	await expect.poll(async () => (await inbox()).length).toBe(2);
	const messages = await inbox();

	const notification = messages.find((m) => m.subject.includes("New contact form submission"));
	expect(notification?.to).toBe("inbox@example.com");
	expect(notification?.raw).toContain("grace@example.com");

	const confirmation = messages.find((m) => m.to === "grace@example.com");
	expect(confirmation?.subject).toContain("We've received your message");
});

test("empty/invalid fields show validation errors and send no email", async ({ page, inbox }) => {
	await page.goto("/en/contact");

	await page.getByLabel("Email").fill("not-an-email");
	await page.getByLabel("Message").fill("too short");
	await page.getByRole("button", { name: "Send message" }).click();

	await expect(page.getByText("Please enter your name (2-100 characters).")).toBeVisible();
	await expect(page.getByText("Please enter a valid email address.")).toBeVisible();
	await expect(page.getByText("Please enter a message (10-5000 characters).")).toBeVisible();

	expect(await inbox()).toEqual([]);
});

test("a 4th rapid submission from the same IP is rate-limited", async ({ page }) => {
	await page.goto("/en/contact");

	for (let i = 1; i <= 3; i++) {
		await page.getByLabel("Name").fill(`Sender ${i}`);
		await page.getByLabel("Email").fill(`sender${i}@example.com`);
		await page.getByLabel("Message").fill(`Message number ${i}, long enough to pass validation.`);
		await page.getByRole("button", { name: "Send message" }).click();
		await expect(page.getByRole("status")).toHaveText("Thanks — your message has been sent.");
	}

	await page.getByLabel("Name").fill("Sender 4");
	await page.getByLabel("Email").fill("sender4@example.com");
	await page.getByLabel("Message").fill("Message number 4, long enough to pass validation.");
	await page.getByRole("button", { name: "Send message" }).click();

	// Not getByRole("alert") — Next's own route-announcer div also carries
	// role="alert" (empty, for screen-reader route-change announcements) and
	// collides with this locator.
	await expect(page.getByText("You're sending messages too quickly — please wait a moment and try again.")).toBeVisible();
});
