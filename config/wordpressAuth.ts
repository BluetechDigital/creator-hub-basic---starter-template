/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Server-only — the application password must never reach a client bundle.
import "server-only";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const WP_APPLICATION_USERNAME: string | undefined = process.env.WP_APPLICATION_USERNAME;
const WP_APPLICATION_PASSWORD: string | undefined = process.env.WP_APPLICATION_PASSWORD;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXX WordPress REST Basic Auth Header XXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

let warned = false;

/**
 * The `Authorization: Basic ...` header WordPress's core REST API (`/wp-json/wp/v2/...`)
 * requires to write content as a real, authenticated WP user — an Application
 * Password (WP core since 5.6, `Users → Profile → Application Passwords`), not
 * the site's regular login password. Used by `api/WordPress/CreateVideoArticleDraft.ts`,
 * the first thing in this codebase that writes to WordPress *as a user* rather
 * than just proving a mutation originated from this server (see
 * `config/graphqlProxySecret.ts`'s very different `X-Creator-Hub-Proxy-Secret`,
 * which WPGraphQL's `createPost` does not accept as a substitute for real user
 * auth).
 *
 * Spread into a REST `fetch`'s `headers`. Returns `{}` when either half of the
 * credential isn't configured yet — the caller then gets a WP `401` naturally,
 * same "fails closed with a clear signal" shape as an unset reCAPTCHA secret in
 * production — but warns once per process in production so a misconfigured
 * deploy is visible.
 */
export const wordpressAuthHeaders = (): Record<string, string> => {
	if (!WP_APPLICATION_USERNAME || !WP_APPLICATION_PASSWORD) {
		if (!warned && process.env.NODE_ENV === "production") {
			warned = true;
			console.warn(
				"WP_APPLICATION_USERNAME / WP_APPLICATION_PASSWORD are not set — WordPress REST writes will be rejected. " +
					"See docs/video-to-article-setup.md.",
			);
		}
		return {};
	}

	const credentials = Buffer.from(`${WP_APPLICATION_USERNAME}:${WP_APPLICATION_PASSWORD}`).toString("base64");
	return { Authorization: `Basic ${credentials}` };
};
