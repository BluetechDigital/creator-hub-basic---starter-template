/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Server-only — the OAuth client secret and refresh token must never reach a client bundle.
import "server-only";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const YOUTUBE_OAUTH_CLIENT_ID: string | undefined = process.env.YOUTUBE_OAUTH_CLIENT_ID;
const YOUTUBE_OAUTH_CLIENT_SECRET: string | undefined = process.env.YOUTUBE_OAUTH_CLIENT_SECRET;
const YOUTUBE_OAUTH_REFRESH_TOKEN: string | undefined = process.env.YOUTUBE_OAUTH_REFRESH_TOKEN;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX YouTube OAuth Access Token XXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IGoogleTokenResponse = {
	access_token: string;
	expires_in: number;
	token_type: string;
	scope?: string;
};

/**
 * Mints a short-lived OAuth access token from `YOUTUBE_OAUTH_REFRESH_TOKEN` —
 * needed only for `api/YouTube/GetVideoCaptions.ts`'s `captions.download` call,
 * which (unlike the rest of this app's read-only `YOUTUBE_KEY` API-key access)
 * is an owner-only endpoint requiring the channel owner to have granted consent
 * once (see `scripts/get-youtube-refresh-token.mjs` and
 * `docs/video-to-article-setup.md`).
 *
 * Unlike the Instagram long-lived token this codebase already manages
 * (`config/instagramToken.ts`, which *rotates* on every refresh and needs
 * persisting to Edge Config so the new value survives past that one request),
 * a Google OAuth refresh token does not rotate when used — the same
 * `YOUTUBE_OAUTH_REFRESH_TOKEN` value keeps working indefinitely (until
 * revoked), so minting a fresh access token in-memory on every call, with
 * nothing written back anywhere, is sufficient. No token-persistence layer
 * needed here.
 * @returns A fresh access token, valid for `expires_in` seconds (Google's
 * default is one hour) — always mint a new one per use rather than caching it
 * across requests.
 */
export const getYoutubeAccessToken = async (): Promise<string> => {
	if (!YOUTUBE_OAUTH_CLIENT_ID || !YOUTUBE_OAUTH_CLIENT_SECRET || !YOUTUBE_OAUTH_REFRESH_TOKEN) {
		throw new Error(
			"Missing YouTube OAuth environment variables (YOUTUBE_OAUTH_CLIENT_ID, YOUTUBE_OAUTH_CLIENT_SECRET, or YOUTUBE_OAUTH_REFRESH_TOKEN).",
		);
	}

	const response = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			client_id: YOUTUBE_OAUTH_CLIENT_ID,
			client_secret: YOUTUBE_OAUTH_CLIENT_SECRET,
			refresh_token: YOUTUBE_OAUTH_REFRESH_TOKEN,
			grant_type: "refresh_token",
		}),
	});

	if (!response.ok) {
		throw new Error(`Google OAuth token exchange failed (${response.status}): ${await response.text()}`);
	}

	const data: IGoogleTokenResponse = await response.json();
	return data.access_token;
};
