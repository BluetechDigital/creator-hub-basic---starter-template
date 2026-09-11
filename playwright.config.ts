import { defineConfig, devices } from "@playwright/test";
import { nextEnv, GRAPHQL_PORT, NEXT_PORT, NEXT_ORIGIN } from "./e2e/fixtures/env.mjs";

/* -----------------------------------------------------------------------------
End-to-end tests. See ARCHITECTURE.md (Testing) for the design — the app runs
against local fake backends (fake WPGraphQL + fake SMTP, started as webServer
entries below), and the web server is `next dev` deliberately, not `next start`:
dev's NODE_ENV=development makes reCAPTCHA verification skip when unset
(config/recaptcha.ts), which fails CLOSED in production. Production-compile
validation lives in the CI `quality` job's `npm run build` step instead.

Specs are `e2e/[name].spec.ts` — distinct from Vitest's `[name].test.{ts,tsx}`
glob so the two runners never collide.
----------------------------------------------------------------------------- */

const isCI = !!process.env.CI;

export default defineConfig({
	testDir: "./e2e",
	testMatch: "**/*.spec.ts",
	fullyParallel: true,
	forbidOnly: isCI,
	retries: isCI ? 2 : 0,
	// One worker: config/rateLimit.ts is a per-process in-memory Map and the
	// fake backend holds shared request/inbox state, so parallel workers (each
	// its own everything only for the browser, but sharing the one Next + one
	// fake server) would race on that shared state. Specs use per-file
	// x-forwarded-for IPs for rate-limit isolation instead of parallelism.
	workers: 1,
	reporter: isCI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],

	use: {
		baseURL: NEXT_ORIGIN,
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},

	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

	webServer: [
		{
			command: "node e2e/fixtures/server.mjs",
			url: `http://localhost:${GRAPHQL_PORT}/__health`,
			reuseExistingServer: !isCI,
			stdout: "pipe",
			stderr: "pipe",
			timeout: 30_000,
		},
		{
			// Wipes the whole `.next` directory first, not just `.next/cache`:
			// every graphql/CMS/*.ts fetch uses `next: { revalidate: 86400 }`,
			// and Next's on-disk Data Cache survives a `next dev` restart — a
			// page can render from a PRIOR run's cached response without ever
			// hitting the fake GraphQL server. Confirmed live this has to be the
			// *whole* `.next` dir, not just `.next/cache`: a leftover `next
			// build` output sitting alongside `next dev`'s own `.next/dev`
			// (e.g. from CI's `quality` job running locally, or a manual `npm
			// run build`) made `next dev` serve build-time prerendered HTML for
			// `/posts` instead of ever calling the fake GraphQL server — pages
			// rendered "successfully" with real-looking content while
			// /__graphql-log stayed completely empty.
			command: `node -e "require('fs').rmSync('.next',{recursive:true,force:true})" && npx next dev --port ${NEXT_PORT}`,
			url: `${NEXT_ORIGIN}/en`,
			reuseExistingServer: !isCI,
			stdout: "pipe",
			stderr: "pipe",
			timeout: 120_000,
			env: nextEnv,
		},
	],
});
