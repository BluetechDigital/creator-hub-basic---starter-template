/* -----------------------------------------------------------------------------
Playwright test extensions shared by every spec — resets the fake backend
before each test, and gives specs typed helpers for the two things the fake
server records: GraphQL requests and sent email.

Every spec that submits a form also gets a unique `x-forwarded-for` value via
`ip` (see `config/rateLimit.ts` — a per-process in-memory Map keyed by IP), so
one spec's submissions never trip another's rate-limit bucket. A counter
(not the test title) keeps the value short and collision-free within a run.
----------------------------------------------------------------------------- */

import { test as base, expect, type BrowserContext } from "@playwright/test";
import { FIXTURE_ORIGIN } from "../fixtures/env.mjs";

/**
 * Pre-accepts the cookie-consent banner (`context/providers/CookiePolicyContextProvider.tsx`
 * reads a `cookie-consent=accepted` cookie) so it isn't sitting over the page
 * intercepting clicks. Every spec that interacts with page content below the
 * banner calls this in a `beforeEach` — except `routing-i18n.spec.ts`'s
 * LocaleSwitcher test, which deliberately leaves it unset to assert the banner
 * itself.
 */
export const acceptCookieConsent = async (context: BrowserContext) => {
	await context.addCookies([
		{ name: "cookie-consent", value: "accepted", domain: "localhost", path: "/" },
	]);
};

type IGraphqlLogEntry = { op: string; variables: Record<string, unknown> };
type IInboxEntry = { to: string; from: string; subject: string; raw: string };

let ipCounter = 1;

type IFixtures = {
	/** Resets the fake backend's GraphQL log and SMTP inbox — runs automatically before every test. */
	resetFixtures: void;
	/** A unique `10.0.0.N` address for this test, to use as `x-forwarded-for` (see `config/rateLimit.ts`) so its form submissions never share a rate-limit bucket with another test's. */
	ip: string;
	/** Reads the fake WPGraphQL server's recorded request log (operation name + variables, in order). */
	graphqlLog: () => Promise<IGraphqlLogEntry[]>;
	/** Reads the fake SMTP server's captured inbox. */
	inbox: () => Promise<IInboxEntry[]>;
};

export const test = base.extend<IFixtures>({
	ip: async ({}, use) => {
		await use(`10.0.0.${ipCounter++}`);
	},

	resetFixtures: [
		async ({ request }, use) => {
			await request.post(`${FIXTURE_ORIGIN}/__reset`);
			await use();
		},
		{ auto: true },
	],

	graphqlLog: async ({ request }, use) => {
		await use(async () => {
			const response = await request.get(`${FIXTURE_ORIGIN}/__graphql-log`);
			return response.json();
		});
	},

	inbox: async ({ request }, use) => {
		await use(async () => {
			const response = await request.get(`${FIXTURE_ORIGIN}/__inbox`);
			return response.json();
		});
	},
});

export { expect };
