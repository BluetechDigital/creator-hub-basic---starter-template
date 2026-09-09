
/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { getInstagramToken } from "@/config/instagramToken";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Base URL for the Instagram Graph API
const INSTAGRAM_GRAPH_API_BASE_URL = 'https://graph.instagram.com';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export type IInstagramMediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';

/** One slide inside a `CAROUSEL_ALBUM` post. */
export type IInstagramChild = {
    id: string;
    media_type: IInstagramMediaType;
    media_url: string;
    /** Poster frame for a video child (`media_url` is the raw video otherwise). */
    thumbnail_url?: string;
};

// IInstagramFeed defines the structure of the data returned by this function
export type IInstagramFeed = {
    id: string;
    media_type: IInstagramMediaType;
    media_url: string;
    /** Poster frame for a `VIDEO` post (`media_url` is the raw video). */
    thumbnail_url?: string;
    timestamp: string; // ISO 8601 format
    caption: string;
    permalink: string;
    username: string;
    /** Public like count — may be absent for some media. */
    like_count?: number;
    /** Public comment count. */
    comments_count?: number;
    /** Present on `CAROUSEL_ALBUM` posts — the individual images/videos. */
    children?: { data: IInstagramChild[] };
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
 * Refreshes a long-lived Instagram Graph API access token. Instagram rotates the
 * string on every refresh and resets its 60-day life from the moment of the
 * call. Driven by the weekly cron at `/api/instagram/refresh-token`, which hands
 * the returned token to `persistInstagramToken` — see `config/instagramToken.ts`
 * for why persistence (rather than a per-request refresh) is what keeps the feed
 * alive past day 60.
 *
 * Best-effort: a failed refresh is logged and swallowed (returns `null`) rather
 * than thrown, so a transient blip doesn't fail the cron run — the previous
 * token stays valid until its own expiry and next week's run retries.
 * @param accessToken The current long-lived token to refresh (must be ≥ 24h old
 * and not expired).
 * @returns The refreshed token and its computed expiry date, or `null` if the
 * refresh call failed.
 */
export const refreshInstagramAccessToken = async (
    accessToken: string,
): Promise<{ accessToken: string; expiresAt: Date } | null> => {
    try {
        const url = `${INSTAGRAM_GRAPH_API_BASE_URL}/refresh_access_token?grant_type=ig_refresh_token&access_token=${accessToken}`;

        // No `next.revalidate` — the cron wants a live refresh every run, not a
        // cached response keyed by the (rotating) token.
        const response = await fetch(url, { cache: "no-store" });

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`Instagram token refresh failed (${response.status}):`, errorData?.error?.message ?? errorData);
            return null;
        }

        const data: IRawRefreshTokenResponse = await response.json();
        const expiresAt = new Date(Date.now() + data.expires_in * 1000);

        console.warn(`[Instagram] Access token refreshed, valid until ${expiresAt.toISOString()}.`);

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
 * `/me/media` endpoint. The token comes from `getInstagramToken` (the
 * cron-refreshed value in Edge Config, or `INSTAGRAM_ACCESS_TOKEN` as a
 * fallback) — this function no longer refreshes it itself; the weekly cron owns
 * that (see `config/instagramToken.ts`).
 *
 * The Graph API version is hardcoded (`API_VERSION`) rather than configurable, and the
 * fetch limit is a fixed 24 most-recent items — both are deliberate simplifications
 * for this template rather than environment-driven settings. (The `InstagramFeed`
 * block shows the first 9 and reveals the rest behind a "Show more" button, so the
 * batch is sized a little above that.) Note: the
 * `INSTAGRAM_FEED_MEDIA_TYPE` env var referenced elsewhere in the app is intentionally
 * NOT used here — media type filtering is instead handled via the `fields` parameter.
 * @param accessTokenOverride Optional token to use instead of the stored one —
 * lets a future per-client onboarding flow supply a dynamically-obtained
 * consented token without changes to this function.
 * @returns The account's recent media items (images, videos, and carousel albums).
 */
export const getAllInstagramFeedContent = async (accessTokenOverride?: string): Promise<IInstagramFeed> => {

    // 1. Defensive Checks — resolve the current access token (override → Edge Config → env var)
    const accessToken = accessTokenOverride ?? (await getInstagramToken());

    if (!accessToken) {
        throw new Error("INSTAGRAM_ACCESS_TOKEN environment variable is missing. Cannot fetch Instagram feed.");
    }

    // 2. Construct API URL with required fields and current version
    const API_VERSION = 'v23.0';
    // Fields must be explicitly requested. `children{…}` expands carousel slides;
    // `like_count`/`comments_count` power the hover overlay; `thumbnail_url` is a
    // video's poster frame.
    const fields =
        'id,media_type,media_url,thumbnail_url,timestamp,caption,permalink,username,like_count,comments_count,children{id,media_type,media_url,thumbnail_url}';
    const limit = 24; // 9 shown initially + the rest behind "Show more" (InstagramFeed)

    const url = `${INSTAGRAM_GRAPH_API_BASE_URL}/${API_VERSION}/me/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`;

    try {
        // 3. Fetch Data. 1h cache — long enough that visitors don't each hit
        // the Graph API, short enough that a transient Instagram outage (which
        // makes the block render its empty state, and Next then caches that
        // page) self-heals within the hour instead of needing a redeploy.
        // The `instagram-feed` tag lets the token-refresh cron force a refetch
        // right after it rotates the token.
        const response = await fetch(url, {
            next: { revalidate: 3600, tags: ["instagram-feed"] },
        });

        if (!response.ok) {
            const errorData = await response.json();
            // Throw a detailed error if the API request failed
            throw new Error(`Instagram API Error (${response.status}): ${errorData?.error?.message || 'Unknown API failure'}`);
        }

        const instagramFeed: IRawInstagramResponse = await response.json();

        // 4. The media array is located under the 'data' key of the response
        return instagramFeed.data as IInstagramFeed;

    } catch (error: unknown) {
        console.error("Error fetching Instagram feed:", error);

        // Re-throw a generic error after logging the detailed one
        throw new Error(
            "Failed to retrieve Instagram feed content. Check API token and network connection."
        );
    }
};
