#!/usr/bin/env node

/* -----------------------------------------------------------------------------
One-time, local-only setup script — NOT part of the app's runtime, never
deployed, never imported by any app code. Mints a YouTube OAuth refresh token
(YOUTUBE_OAUTH_REFRESH_TOKEN) for the "Video-to-article transcription" feature
(app/api/videos/generate-articles/route.ts) — see docs/video-to-article-setup.md
for the full walkthrough (Google Cloud OAuth client setup, required scope,
redirect URI registration) before running this.

Usage (run once, as the YouTube channel owner, in a browser you're signed into
that channel with):

    YOUTUBE_OAUTH_CLIENT_ID=... YOUTUBE_OAUTH_CLIENT_SECRET=... node scripts/get-youtube-refresh-token.mjs

The printed refresh token does not rotate or expire on its own (unlike the
Instagram long-lived token this codebase also manages) — set it once as
YOUTUBE_OAUTH_REFRESH_TOKEN and it keeps working indefinitely, until revoked.
----------------------------------------------------------------------------- */

import { createServer } from "node:http";

const CLIENT_ID = process.env.YOUTUBE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_OAUTH_CLIENT_SECRET;
const PORT = Number(process.env.PORT ?? 8991);
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const SCOPE = "https://www.googleapis.com/auth/youtube.force-ssl";

if (!CLIENT_ID || !CLIENT_SECRET) {
	console.error(
		"Missing YOUTUBE_OAUTH_CLIENT_ID / YOUTUBE_OAUTH_CLIENT_SECRET.\n" +
			"Set both (from your Google Cloud OAuth 2.0 Client) and re-run — see docs/video-to-article-setup.md.",
	);
	process.exit(1);
}

const consentUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
consentUrl.searchParams.set("client_id", CLIENT_ID);
consentUrl.searchParams.set("redirect_uri", REDIRECT_URI);
consentUrl.searchParams.set("response_type", "code");
consentUrl.searchParams.set("scope", SCOPE);
// offline + consent: forces Google to actually issue a refresh token, not
// just a short-lived access token — a repeat consent without "prompt=consent"
// silently omits it if this app was already authorized once before.
consentUrl.searchParams.set("access_type", "offline");
consentUrl.searchParams.set("prompt", "consent");

console.log("\n1. Make sure you're signed into the browser as the YouTube channel owner.");
console.log("2. Make sure this exact redirect URI is registered on the OAuth client:");
console.log(`   ${REDIRECT_URI}`);
console.log("3. Open this URL and grant consent:\n");
console.log(consentUrl.toString());
console.log(`\nWaiting for the redirect on ${REDIRECT_URI} ...`);

const server = createServer(async (request, response) => {
	const url = new URL(request.url ?? "/", REDIRECT_URI);
	if (url.pathname !== "/oauth2callback") {
		response.writeHead(404).end();
		return;
	}

	const code = url.searchParams.get("code");
	const error = url.searchParams.get("error");

	if (error || !code) {
		response.writeHead(400, { "Content-Type": "text/plain" }).end(`Consent failed: ${error ?? "no code returned"}`);
		console.error(`\nConsent failed: ${error ?? "no code returned"}`);
		server.close();
		process.exit(1);
	}

	try {
		const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				client_id: CLIENT_ID,
				client_secret: CLIENT_SECRET,
				code,
				redirect_uri: REDIRECT_URI,
				grant_type: "authorization_code",
			}),
		});

		const data = await tokenResponse.json();

		if (!tokenResponse.ok || !data.refresh_token) {
			response.writeHead(500, { "Content-Type": "text/plain" }).end("Token exchange failed — see the terminal.");
			console.error("\nToken exchange failed:", data);
			server.close();
			process.exit(1);
		}

		response.writeHead(200, { "Content-Type": "text/plain" }).end("Success — you can close this tab and return to the terminal.");

		console.log("\nSet this as YOUTUBE_OAUTH_REFRESH_TOKEN:\n");
		console.log(data.refresh_token);
		console.log("");

		server.close();
		process.exit(0);

	} catch (fetchError) {
		response.writeHead(500, { "Content-Type": "text/plain" }).end("Token exchange failed — see the terminal.");
		console.error("\nToken exchange request failed:", fetchError);
		server.close();
		process.exit(1);
	}
});

server.listen(PORT);
