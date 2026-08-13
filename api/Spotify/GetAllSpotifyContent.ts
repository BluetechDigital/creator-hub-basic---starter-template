// SPOTIFY_API_BASE_URL is the base for API calls (e.g., https://api.spotify.com/v1)
const SPOTIFY_API_BASE_URL: string | undefined = process.env.SPOTIFY_API_BASE_URL;
const SPOTIFY_SHOW_ID: string | undefined = process.env.SPOTIFY_SHOW_ID;
const SPOTIFY_CLIENT_ID: string | undefined = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET: string | undefined = process.env.SPOTIFY_CLIENT_SECRET;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type Image = {
    url: string;
    height: number;
    width: number;
};

type IRawCopyright = {
    text: string;
    type: string;
};

// Represents a single episode item
export type ISpotifyEpisode = {
    audio_preview_url: string | null;
    description: string;
    html_description: string;
    duration_ms: number;
    explicit: boolean;
    external_urls: {
        spotify: string;
    };
    href: string;
    id: string;
    images: Image[];
    is_externally_hosted: boolean;
    is_playable: boolean;
    language: string;
    languages: string[];
    name: string;
    release_date: string;
    release_date_precision: string;
    resume_point: {
        fully_played: boolean;
        resume_position_ms: number;
    };
    type: 'episode';
    uri: string;
};

// The array type returned by the episode fetch function
export type ISpotifyEpisodes = ISpotifyEpisode[];

// Raw structure for the paginated response when fetching episodes
type IRawEpisodesResponse = {
    href: string;
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
    items: ISpotifyEpisodes;
};

// Represents the Spotify Show Profile (Podcast)
export type ISpotifyProfile = {
    available_markets: string[];
    copyrights: IRawCopyright[]; // Now type-safe
    description: string;
    html_description: string;
    explicit: boolean;
    external_urls: {
        spotify: string;
    };
    href: string;
    id: string;
    images: Image[];
    is_externally_hosted: boolean;
    languages: string[];
    media_type: string;
    name: string;
    publisher: string;
    type: 'show';
    uri: string;
    total_episodes: number;
    // Note: The episodes field is generally not present in the /shows/{id} endpoint response
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Spotify Access Token XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IAccessTokenResponse = {
    access_token: string;
    token_type: string;
    expires_in: number;
};

/**
 * Obtains a Spotify access token via the Client Credentials flow — the
 * app-only auth mode that doesn't require a user login, appropriate here
 * since this template only ever reads public show/episode data.
 * @returns A bearer access token for authorizing subsequent Spotify Web API calls.
 */
export const getAllSpotifyProjectAccessToken = async (): Promise<string> => {
    try {
        if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
            throw new Error(
                "Spotify Client ID or Client Secret is missing. Check .env"
            );
        }

        const authHeader = Buffer.from(
            `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
        ).toString("base64");

        // NOTE: The Spotify token endpoint is https://accounts.spotify.com/api/token
        const tokenUrl = "https://accounts.spotify.com/api/token"; 

        const response = await fetch(tokenUrl, {
            method: "POST",
            headers: {
                Authorization: `Basic ${authHeader}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: "grant_type=client_credentials",
        });

        const data: IAccessTokenResponse & { error_description?: string, error?: string } = await response.json();

        if (!response.ok) {
            throw new Error(
                `Failed to get access token: ${data.error_description || data.error || response.statusText}`
            );
        }

        return data.access_token;
    } catch (error: unknown) {
        console.error(error);
        throw new Error(
            "Something went wrong while fetching the Spotify access token"
        );
    }
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXX Spotify Show Profile (Read Only) XXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Fetches the main profile information for a Spotify Podcast Show (the
 * `/shows/{id}` endpoint), first obtaining a fresh access token.
 * @returns The show's profile. Does not include an `episodes` key — the
 * `/shows/{id}` response doesn't return one; use
 * getAllSpotifyPodcastEpisodes() for episode data.
 */
export const getAllSpotifyShowProfile = async (): Promise<ISpotifyProfile> => {
    try {
        const spotifyAccessToken: string = await getAllSpotifyProjectAccessToken();

        if (!SPOTIFY_API_BASE_URL || !SPOTIFY_SHOW_ID) {
            throw new Error("Spotify API URL or Show ID is missing. Please check .env");
        }

        const url: string = `${SPOTIFY_API_BASE_URL}/shows/${SPOTIFY_SHOW_ID}`;

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${spotifyAccessToken}`,
                "Content-Type": "application/json",
            },
            next: { revalidate: 3600 },
        });

        const profileData: ISpotifyProfile & { error?: { message: string } } = await response.json();

        if (!response.ok) {
            throw new Error(`Spotify API error: ${profileData.error?.message || response.statusText}`);
        }
        
        // Return the full profile (no 'episodes' key to omit based on the API response structure)
        return profileData; 
    } catch (error: unknown) {
        console.error(error);
        throw new Error(
            "Something went wrong trying to fetch Spotify podcast profile"
        );
    }
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXX Spotify Podcast Episodes (Feed) XXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Fetches episodes for a Spotify Podcast Show, following the API's own `next`
 * pagination URL (50 episodes per page) until either the show runs out of
 * episodes or 100 episodes have been collected. The 100-item cap is a
 * deliberate business decision for this template (to bound feed size/response
 * time), not a limit imposed by the Spotify API itself — shows with more
 * episodes than that will have older ones truncated.
 * @returns Up to 100 of the show's most recent episodes, in the order
 * returned by the API.
 */
export const getAllSpotifyPodcastEpisodes = async (): Promise<ISpotifyEpisodes> => {
    try {
        const spotifyAccessToken: string = await getAllSpotifyProjectAccessToken();
        const spotifyEpisodesFullData: ISpotifyEpisodes = [];

        if (!SPOTIFY_API_BASE_URL || !SPOTIFY_SHOW_ID) {
            throw new Error("Spotify API URL or Show ID is missing. Please check .env");
        }

        let nextPageURL: string | null = `${SPOTIFY_API_BASE_URL}/shows/${SPOTIFY_SHOW_ID}/episodes?limit=50`;

        do {
            const response = await fetch(nextPageURL, {
                headers: {
                    Authorization: `Bearer ${spotifyAccessToken}`,
                    "Content-Type": "application/json",
                },
                next: { revalidate: 3600 },
            });

            // Use the type-safe response type
            const podcastData: IRawEpisodesResponse & { error?: { message: string } } = await response.json();

            if (!response.ok) {
                throw new Error(`Spotify API error: ${podcastData.error?.message || response.statusText}`);
            }

            if (podcastData?.items) {
                // The API provides the episodes array directly, which matches ISpotifyEpisodes (array of ISpotifyEpisode)
                spotifyEpisodesFullData.push(...podcastData.items);

                if (spotifyEpisodesFullData.length >= 100) {
                    break;
                }
            }

            nextPageURL = podcastData.next; // Spotify API provides the full URL for the next page
        } while (nextPageURL && spotifyEpisodesFullData.length < 100);

        return spotifyEpisodesFullData.slice(0, 100);
    } catch (error: unknown) {
        console.error(error);
        throw new Error(
            "Something went wrong trying to fetch Spotify podcast episodes"
        );
    }
};