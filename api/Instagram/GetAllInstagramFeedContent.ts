
/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Base URL for the Instagram Graph API
const INSTAGRAM_GRAPH_API_BASE_URL = 'https://graph.instagram.com'; 

// Key environment variables (assuming you use long-lived tokens)
const INSTAGRAM_ACCESS_TOKEN: string | undefined = process.env.INSTAGRAM_ACCESS_TOKEN;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// IInstagramFeed defines the structure of the data returned by this function
export type IInstagramFeed = {
    id: string;
    media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
    media_url: string;
    timestamp: string; // ISO 8601 format
    caption: string;
    permalink: string;
    username: string;
}[];

// Type for the raw response from the API (the data is wrapped in an object with a 'data' key)
type IRawInstagramResponse = {
    data: IInstagramFeed;
    paging?: {
        cursors: {
            before: string;
            after: string;
        };
        next?: string;
    };
};

// Raw response shape from Instagram's /refresh_access_token endpoint
type IRawRefreshTokenResponse = {
    access_token: string;
    token_type: string; // "bearer"
    expires_in: number; // seconds until expiry (typically ~5,184,000 = 60 days)
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX Access Token Refresh XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Refreshes a long-lived Instagram Graph API access token, extending its validity by
 * another ~60 days. Instagram allows refreshing any time after a token is 24 hours
 * old, so calling this on the same 24h cache cadence as the feed fetch itself (see
 * `getAllInstagramFeedContent`) keeps the token perpetually alive rather than letting
 * it silently expire from inactivity.
 *
 * Best-effort by design: a failed refresh only affects the token's future longevity,
 * not this request's ability to fetch the feed with the still-valid current token — so
 * failures are logged and swallowed (return `null`) rather than thrown, and the caller
 * falls back to the token it already has.
 *
 * KNOWN LIMITATION: this app has no persistent storage anywhere (no database, no KV,
 * and no WordPress write/mutation capability — `graphql/CMS/` is 100% read-only). The
 * refreshed token can't be written back to wherever `INSTAGRAM_ACCESS_TOKEN` is sourced
 * from (a `.env` value) by running server code, so this extends the token for use
 * *within this request* but can't persist that extension across deploys/cold starts on
 * its own. The new token is logged clearly so it can be copied into the client's env
 * vars manually before the current one actually expires. Automating that write (e.g.
 * via a new authenticated WPGraphQL mutation storing it in CMS theme options) is a
 * separate, larger piece of infrastructure this template doesn't build.
 * @param accessToken The current long-lived token to refresh.
 * @returns The refreshed token and its computed expiry date, or `null` if the refresh
 * call failed.
 */
const refreshInstagramAccessToken = async (accessToken: string): Promise<{ accessToken: string; expiresAt: Date } | null> => {
    try {
        const url = `${INSTAGRAM_GRAPH_API_BASE_URL}/refresh_access_token?grant_type=ig_refresh_token&access_token=${accessToken}`;

        const response = await fetch(url, {
            next: { revalidate: 86400 },
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`Instagram token refresh failed (${response.status}):`, errorData?.error?.message ?? errorData);
            return null;
        }

        const data: IRawRefreshTokenResponse = await response.json();
        const expiresAt = new Date(Date.now() + data.expires_in * 1000);

        // No persistent storage exists in this app (see doc comment above) — surface
        // the refreshed token clearly in logs so it can be copied into the client's
        // env vars before the current one actually expires.
        console.warn(
            `[Instagram] Access token refreshed, valid until ${expiresAt.toISOString()}. ` +
            `This refresh is NOT persisted automatically — update INSTAGRAM_ACCESS_TOKEN ` +
            `with the new value:\n${data.access_token}`
        );

        return { accessToken: data.access_token, expiresAt };

    } catch (error: unknown) {
        console.error("Error refreshing Instagram access token:", error);
        return null;
    }
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX Instagram API Feed XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Fetches a consented Instagram account's recent media via the Instagram Graph API's
 * `/me/media` endpoint, refreshing the access token first (see
 * `refreshInstagramAccessToken`) so a long-running deployment's token stays alive.
 * The Graph API version is hardcoded (`API_VERSION`) rather than configurable, and the
 * fetch limit is a fixed 10 most-recent items — both are deliberate simplifications
 * for this template rather than environment-driven settings. Note: the
 * `INSTAGRAM_FEED_MEDIA_TYPE` env var referenced elsewhere in the app is intentionally
 * NOT used here — media type filtering is instead handled via the `fields` parameter.
 * @param accessTokenOverride Optional token to use instead of `INSTAGRAM_ACCESS_TOKEN`
 * — lets a future per-client onboarding flow supply a dynamically-obtained consented
 * token without changes to this function, rather than only ever reading one global
 * env var.
 * @returns The account's recent media items (images, videos, and carousel albums).
 */
export const getAllInstagramFeedContent = async (accessTokenOverride?: string): Promise<IInstagramFeed> => {

    // 1. Defensive Checks for required credentials
    const configuredAccessToken = accessTokenOverride ?? INSTAGRAM_ACCESS_TOKEN;

    if (!configuredAccessToken) {
        throw new Error("INSTAGRAM_ACCESS_TOKEN environment variable is missing. Cannot fetch Instagram feed.");
    }

    // 2. Refresh the token (best-effort — falls back to the configured token on failure)
    const refreshed = await refreshInstagramAccessToken(configuredAccessToken);
    const accessToken = refreshed?.accessToken ?? configuredAccessToken;

    // 3. Construct API URL with required fields and current version
    const API_VERSION = 'v19.0';
    // Fields must be explicitly requested
    const fields = 'id,media_type,media_url,timestamp,caption,permalink,username';
    const limit = 10; // Fetch a reasonable number of recent posts

    const url = `${INSTAGRAM_GRAPH_API_BASE_URL}/${API_VERSION}/me/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`;

    try {
        // 4. Fetch Data
        // Cache Data for 24 Hours before refetching (86400 seconds)
        const response = await fetch(url, {
            next: { revalidate: 86400 },
        });

        if (!response.ok) {
            const errorData = await response.json();
            // Throw a detailed error if the API request failed
            throw new Error(`Instagram API Error (${response.status}): ${errorData?.error?.message || 'Unknown API failure'}`);
        }

        const instagramFeed: IRawInstagramResponse = await response.json();
        
        // The media array is located under the 'data' key of the response
        return instagramFeed.data as IInstagramFeed; 

    } catch (error: unknown) {
        console.error("Error fetching Instagram feed:", error);
        
        // Re-throw a generic error after logging the detailed one
        throw new Error(
            "Failed to retrieve Instagram feed content. Check API token and network connection."
        );
    }
};