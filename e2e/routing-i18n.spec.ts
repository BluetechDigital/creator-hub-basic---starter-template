/* -----------------------------------------------------------------------------
Locale routing (`proxy.ts`) + the LocaleSwitcher — see that file's own doc
comment for the resolution order this exercises: `NEXT_LOCALE` cookie ->
`Accept-Language` -> default locale. All 6 locales route to the same "Home"
fixture (translated for non-en via the fake Azure endpoint), so these tests
only assert on routing/locale plumbing, not page content.
----------------------------------------------------------------------------- */

import { test, expect } from "./support/fixtures";

test.describe("proxy.ts locale redirect", () => {
	test("/ redirects (307) to the default locale", async ({ page }) => {
		const response = await page.request.get("/", { maxRedirects: 0 });
		expect(response.status()).toBe(307);
		expect(response.headers()["location"]).toMatch(/\/en$/);
	});

	test("Accept-Language: fr redirects to /fr", async ({ page }) => {
		const response = await page.request.get("/", {
			headers: { "accept-language": "fr-FR,fr;q=0.9" },
			maxRedirects: 0,
		});
		expect(response.status()).toBe(307);
		expect(response.headers()["location"]).toMatch(/\/fr$/);
	});

	test("a NEXT_LOCALE cookie redirects to that locale, overriding Accept-Language", async ({ page, context }) => {
		await context.addCookies([
			{ name: "NEXT_LOCALE", value: "es", domain: "localhost", path: "/" },
		]);

		const response = await page.request.get("/", {
			headers: { "accept-language": "fr-FR,fr;q=0.9" },
			maxRedirects: 0,
		});
		expect(response.status()).toBe(307);
		expect(response.headers()["location"]).toMatch(/\/es$/);
	});

	test("an already-locale-prefixed path passes through unchanged", async ({ page }) => {
		const response = await page.request.get("/de", { maxRedirects: 0 });
		expect(response.status()).toBe(200);
	});

	test("/robots.txt and /sitemap.xml are not locale-redirected", async ({ page }) => {
		const robots = await page.request.get("/robots.txt", { maxRedirects: 0 });
		expect(robots.status()).toBe(200);
		expect(robots.headers()["content-type"]).toContain("text/plain");

		const sitemap = await page.request.get("/sitemap.xml", { maxRedirects: 0 });
		expect(sitemap.status()).toBe(200);
		expect(sitemap.headers()["content-type"]).toContain("xml");
	});

	test("<html lang> matches the URL's locale prefix", async ({ page }) => {
		await page.goto("/fr");
		await expect(page.locator("html")).toHaveAttribute("lang", "fr");
	});
});

test.describe("LocaleSwitcher", () => {
	test("picking a language updates the URL, sets the cookie, and changes on-page text", async ({ page, context }) => {
		await page.goto("/en");

		// The cookie-consent banner (app/[locale]/layout.tsx -> CookiePolicy) is
		// rendered from the static UI dictionary on every page, unauthenticated,
		// with no interaction needed — a stable "a dictionary string changed"
		// probe that doesn't depend on any CMS fixture content.
		await expect(page.getByRole("button", { name: "Accept cookies" })).toBeVisible();

		await page.getByRole("button", { name: /Change language/ }).click();
		await page.getByRole("option", { name: "Français" }).click();

		await expect(page).toHaveURL(/\/fr$/);
		await expect(page.getByRole("button", { name: "Accepter les cookies" })).toBeVisible();

		const cookies = await context.cookies();
		expect(cookies.find((c) => c.name === "NEXT_LOCALE")?.value).toBe("fr");
	});
});
