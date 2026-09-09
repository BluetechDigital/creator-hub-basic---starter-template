/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX Instagram access-token store XXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Reads/writes the live Instagram token — server-only, never client-bundled.
import "server-only";

/* -----------------------------------------------------------------------------
Instagram long-lived tokens rotate: `refresh_access_token` returns a *new*
string every time, and the original expires 60 days after it was minted. So the
value in `INSTAGRAM_ACCESS_TOKEN` can't stay current on its own — left alone it
dies on day 60 and the feed breaks.

The weekly cron at `/api/instagram/refresh-token` refreshes the token and writes
the new string to Vercel Edge Config via `persistInstagramToken`. Every feed
fetch reads the current value through `getInstagramToken`, which prefers Edge
Config and falls back to the env var when Edge Config isn't wired up (local dev,
or before the first cron run) — in that state you're back to updating
`INSTAGRAM_ACCESS_TOKEN` by hand every ~50 days.
----------------------------------------------------------------------------- */

// Vercel names the connection string `EDGE_CONFIG` by default, or `GLOBAL_CONFIG`
// when the store is created as a "Global Config Store" — accept either.
const EDGE_CONFIG_CONNECTION: string | undefined = process.env.EDGE_CONFIG ?? process.env.GLOBAL_CONFIG;
const VERCEL_API_TOKEN: string | undefined = process.env.VERCEL_API_TOKEN;
const VERCEL_TEAM_ID: string | undefined = process.env.VERCEL_TEAM_ID;
const ENV_ACCESS_TOKEN: string | undefined = process.env.INSTAGRAM_ACCESS_TOKEN;

// The Edge Config item key the cron writes and the feed fetch reads.
const TOKEN_KEY = "instagramAccessToken";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX Edge Config connection XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IEdgeConfig = { id: string; token: string; origin: string };

/**
 * Vercel injects `EDGE_CONFIG` as a connection string
 * (`https://edge-config.vercel.com/ecfg_xxx?token=yyy`) when an Edge Config
 * store is linked to the project. The store id (`ecfg_xxx`) is also the id the
 * write API needs, so both come from parsing this one value.
 */
const parseEdgeConfig = (connectionString: string | undefined): IEdgeConfig | null => {
	if (!connectionString) return null;
	try {
		const url = new URL(connectionString);
		const id = url.pathname.split("/").filter(Boolean)[0];
		const token = url.searchParams.get("token");
		if (!id || !token) return null;
		return { id, token, origin: url.origin };
	} catch {
		return null;
	}
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Read XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * The Instagram long-lived access token to use for API calls: the cron-refreshed
 * value from Edge Config, or `INSTAGRAM_ACCESS_TOKEN` when Edge Config is
 * unavailable or hasn't been written yet.
 * @returns The token, or `undefined` if none is configured anywhere.
 */
export const getInstagramToken = async (): Promise<string | undefined> => {
	const edge = parseEdgeConfig(EDGE_CONFIG_CONNECTION);
	if (!edge) return ENV_ACCESS_TOKEN;

	try {
		const response = await fetch(
			`${edge.origin}/${edge.id}/item/${TOKEN_KEY}?token=${edge.token}`,
			// Behind api/Instagram's 1h feed cache already — this short window
			// just collapses a burst of identical reads within one render pass.
			{ next: { revalidate: 300 } },
		);
		if (response.ok) {
			const value: unknown = await response.json();
			if (typeof value === "string" && value) return value;
		}
		// 404 → key not written yet; other non-OK → transient. Fall back.
	} catch (error) {
		console.warn(
			"[instagramToken] Edge Config read failed, using env fallback:",
			error instanceof Error ? error.message : error,
		);
	}
	return ENV_ACCESS_TOKEN;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Write XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Writes a freshly-refreshed token to Edge Config so the running app picks it up
 * without a redeploy. Called only by the refresh cron. Best-effort: when the
 * write credentials aren't set it logs the new token (so it can be pasted into
 * `INSTAGRAM_ACCESS_TOKEN` by hand) and returns `false` rather than throwing.
 * @param token The refreshed long-lived token.
 * @returns Whether the token was persisted to Edge Config.
 */
export const persistInstagramToken = async (token: string): Promise<boolean> => {
	const edge = parseEdgeConfig(EDGE_CONFIG_CONNECTION);
	if (!edge || !VERCEL_API_TOKEN) {
		console.warn(
			"[instagramToken] Cannot persist the refreshed token — EDGE_CONFIG / VERCEL_API_TOKEN " +
			"not set. Update INSTAGRAM_ACCESS_TOKEN manually with the value logged next.",
		);
		console.warn(`[instagramToken] new token: ${token}`);
		return false;
	}

	const url = new URL(`https://api.vercel.com/v1/edge-config/${edge.id}/items`);
	if (VERCEL_TEAM_ID) url.searchParams.set("teamId", VERCEL_TEAM_ID);

	try {
		const response = await fetch(url, {
			method: "PATCH",
			headers: {
				Authorization: `Bearer ${VERCEL_API_TOKEN}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				items: [{ operation: "upsert", key: TOKEN_KEY, value: token }],
			}),
		});
		if (!response.ok) {
			console.error(
				`[instagramToken] Edge Config write failed (${response.status}): ${await response.text()}`,
			);
			return false;
		}
		return true;
	} catch (error) {
		console.error(
			"[instagramToken] Edge Config write error:",
			error instanceof Error ? error.message : error,
		);
		return false;
	}
};
