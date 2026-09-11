/* -----------------------------------------------------------------------------
E2E environment — every value here is dummy / localhost. No real credentials.

Shared by `playwright.config.ts` (passed to the `next dev` webServer) and
`server.mjs` (the fake backend). reCAPTCHA and CREATOR_HUB_GRAPHQL_PROXY_SECRET
are deliberately UNSET (explicit `""`, not simply omitted — see below): `next
dev` runs with NODE_ENV=development, so `config/recaptcha.ts` skips
verification when the secret is missing, and `ch-security.php` isn't in the
loop at all (the fake GraphQL server accepts every mutation).

Every key below is set explicitly, even to `""`, rather than left out of this
object entirely — Next's own `.env`/`.env.local` loading (inside the spawned
`next dev` process) fills in any key that ISN'T already present in
`process.env` from this project's real, git-ignored `.env` file. Confirmed
live: omitting `NEXT_PUBLIC_GOOGLE_V3_RECAPTCHA_SITE_KEY` here let the real
site key leak in, which then made `useRecaptchaV3` try to load Google's actual
recaptcha script — failing/timing out in a browser with no real network path
to Google, which blocked every comment/contact submission client-side before
`submitComment`/`submitContactForm` ever ran.
----------------------------------------------------------------------------- */

// Fake-backend ports. GRAPHQL_PORT serves /graphql + /youtube + control
// endpoints; SMTP_PORT is the fake SMTP the contact form connects to.
export const GRAPHQL_PORT = 4711;
export const SMTP_PORT = 4712;
export const NEXT_PORT = 3000;

export const FIXTURE_ORIGIN = `http://localhost:${GRAPHQL_PORT}`;
export const NEXT_ORIGIN = `http://localhost:${NEXT_PORT}`;

/**
 * The env object handed to the `next dev` process. Merged over `process.env` by
 * Playwright's webServer runner, so anything not listed here still comes from the
 * ambient shell (PATH etc.).
 */
export const nextEnv = {
	// NODE_ENV is left to `next dev` itself (it sets "development"); overriding it
	// here makes Next warn about a non-standard value.

	// Site
	SITE_NAME: "Creator Hub E2E",
	SITE_URL: NEXT_ORIGIN,
	VERCEL_SCRIPT_URL: "https://va.vercel-scripts.com",

	// CMS — the one hard-required var (every graphql/CMS/*.ts throws at import
	// without it). Points at the fake GraphQL server.
	CMS_URL: FIXTURE_ORIGIN,
	DEV_CMS_URL: FIXTURE_ORIGIN,
	NEXT_PUBLIC_CMS_API_URL: `${FIXTURE_ORIGIN}/graphql`,
	IMAGE_DIR_URL: `${FIXTURE_ORIGIN}/uploads`,

	// next.config.ts interpolates these raw into images.remotePatterns and the
	// CSP — they MUST be non-empty valid strings or the config throws / emits a
	// literal "undefined" hostname. Comment avatars in fixtures use
	// secure.gravatar.com (hardcoded-allowlisted in next.config.ts), so these
	// just need to be well-formed, not actually reachable.
	IMAGE_REMOTE_PATTERNS_HOSTNAME_ONE: "i0.wp.com",
	IMAGE_REMOTE_PATHNAME_ONE: "/**",
	IMAGE_REMOTE_PATTERNS_HOSTNAME_TWO: "localhost",
	IMAGE_REMOTE_PATHNAME_TWO: "/**",
	YOUTUBE_IMAGE_REMOTE_PATTERNS_HOSTNAME: "i.ytimg.com",
	YOUTUBE_IMAGE_REMOTE_PATHNAME: "/**",
	YOUTUBE_EMBED_REMOTE_PATTERNS_HOSTNAME: "https://www.youtube-nocookie.com",
	YOUTUBE_EMBED_REMOTE_PATHNAME: "/embed/**",
	INSTAGRAM_IMAGE_REMOTE_PATTERNS_HOSTNAME: "scontent.cdninstagram.com",
	INSTAGRAM_IMAGE_REMOTE_PATHNAME: "/**",
	INSTAGRAM_IMAGE_REMOTE_PATTERNS_HOSTNAME_TWO: "scontent-2.cdninstagram.com",
	INSTAGRAM_IMAGE_REMOTE_PATHNAME_TWO: "/**",

	// Azure Translator — non-`en` pages translate CMS prose + SEO text, and
	// i18n/translateContent.ts does NOT catch a translate failure, so this has
	// to resolve. The fake /azure/translate endpoint echoes each string with a
	// "[<locale>] " prefix so specs can assert the translated page.
	AZURE_TRANSLATOR_KEY: "e2e-dummy-key",
	AZURE_TRANSLATOR_REGION: "e2e-region",
	AZURE_TRANSLATOR_ENDPOINT: `${FIXTURE_ORIGIN}/azure`,

	// YouTube — GetAllYoutubeContent.ts hits YOUTUBE_API_BASE_URL, env-driven,
	// so it lands on the fake server's /youtube router. No real key needed.
	YOUTUBE_API_BASE_URL: `${FIXTURE_ORIGIN}/youtube`,
	YOUTUBE_KEY: "e2e-dummy-key",
	YOUTUBE_CHANNEL_ID: "e2e-channel",
	YOUTUBE_PLAYLIST_ID: "e2e-playlist",

	// Contact form — points at the fake SMTP server. EMAIL_HOST is a literal
	// hostname (not a well-known service shorthand), so config/nodemailer.ts
	// uses host+port.
	EMAIL_HOST: "localhost",
	EMAIL_PORT: String(SMTP_PORT),
	EMAIL_USER: "e2e@example.com",
	EMAIL_PASS: "e2e-password",
	CONTACT_FORM_RECIPIENT_EMAIL: "inbox@example.com",

	// Explicitly blanked, not omitted — see the file-level doc comment above.
	// reCAPTCHA unset -> config/recaptcha.ts skips verification in dev, and
	// useRecaptchaV3 never loads Google's script. CREATOR_HUB_GRAPHQL_PROXY_SECRET
	// unset -> mutations just send no proxy-secret header, which the fake
	// GraphQL server ignores either way. NEXT_PUBLIC_GTM_ID unset -> no real
	// Google Tag Manager script loads during tests.
	NEXT_PUBLIC_GOOGLE_V3_RECAPTCHA_SITE_KEY: "",
	GOOGLE_V3_RECAPTCHA_SECRET_KEY: "",
	CREATOR_HUB_GRAPHQL_PROXY_SECRET: "",
	NEXT_PUBLIC_GTM_ID: "",
};
