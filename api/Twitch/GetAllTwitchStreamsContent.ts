/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Twitch Environment Variables
const TWITCH_API_BASE_URL: string | undefined = process.env.TWITCH_API_BASE_URL;
const TWITCH_CLIENT_ID: string | undefined = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET: string | undefined = process.env.TWITCH_CLIENT_SECRET;
const TWITCH_USER_LOGIN: string | undefined = process.env.TWITCH_USER_LOGIN; // The channel name/login you want to fetch

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type ITwitchStream = {
    id: string;
    user_id: string;
    user_name: string;
    title: string;
    viewer_count: number;
    thumbnail_url: string;
    game_name: string;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXX Helper: Get App Access Token XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Requests a Twitch app access token via the client-credentials grant. This
 * call should typically not be revalidated frequently, as Twitch app tokens
 * are long-lived (e.g. ~60 days).
 * @returns The bearer access token used to authorize subsequent Helix API calls.
 */
const getTwitchAppAccessToken = async (): Promise<string> => {
    if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
        throw new Error("Missing Twitch Client ID or Secret for token generation.");
    }

    const tokenUrl = `https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`;

    const response = await fetch(tokenUrl, { method: 'POST', cache: 'no-store' });
    
    if (!response.ok) {
        throw new Error("Failed to retrieve Twitch App Access Token.");
    }
    
    const data = await response.json();
    return data.access_token;
};

/* -----------------------------------------------------------------------------
XXXXXXXX Fetches the live stream data for a specific Twitch channel XXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Fetches the live stream data for a specific Twitch channel, obtaining an app
 * access token first and checking every 60 seconds whether the channel has
 * gone live or offline.
 * @returns The live stream object if the channel is currently live, or `null`
 * if it's offline. Twitch's `/streams` endpoint always returns an array — it
 * contains exactly one object when live, and is empty when offline.
 */
export const getTwitchChannelLiveStream = async (): Promise<ITwitchStream | null> => {
    if (!TWITCH_API_BASE_URL || !TWITCH_USER_LOGIN || !TWITCH_CLIENT_ID) {
        throw new Error("Missing Twitch API Base URL, User Login, or Client ID.");
    }

    try {
        const accessToken = await getTwitchAppAccessToken();
        
        const url = `${TWITCH_API_BASE_URL}/streams?user_login=${TWITCH_USER_LOGIN}`;
        
        // Fetch stream data using the token
        const response = await fetch(url, {
            headers: {
                'Client-ID': TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${accessToken}`,
            },
            next: { revalidate: 60 }, // Revalidate every 60 seconds to check live status
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Twitch API Error (${response.status}): ${errorData?.message || 'Failed to fetch streams.'}`);
        }

        const data = await response.json();

        return data?.data?.[0] || null;

    } catch (error) {
        console.error("Error fetching Twitch stream content:", error);
        throw new Error("Failed to retrieve Twitch live stream content.");
    }
};