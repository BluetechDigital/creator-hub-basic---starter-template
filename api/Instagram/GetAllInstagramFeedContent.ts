
/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Base URL for the Instagram Graph API
const INSTAGRAM_GRAPH_API_BASE_URL = 'https://graph.instagram.com'; 

// Key environment variables (assuming you use long-lived tokens)
const INSTAGRAM_ACCESS_TOKEN: string | undefined = process.env.INSTAGRAM_ACCESS_TOKEN;

// Note: INSTAGRAM_FEED_MEDIA_TYPE is ignored as media type is handled via the 'fields' parameter

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

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX Instagram API Feed XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export const getAllInstagramFeedContent = async (): Promise<IInstagramFeed> => {
    
    // 1. Defensive Checks for required credentials
    if (!INSTAGRAM_ACCESS_TOKEN) {
        throw new Error("INSTAGRAM_ACCESS_TOKEN environment variable is missing. Cannot fetch Instagram feed.");
    }
    
    // 2. Construct API URL with required fields and current version
    const API_VERSION = 'v19.0'; 
    // Fields must be explicitly requested
    const fields = 'id,media_type,media_url,timestamp,caption,permalink,username';
    const limit = 10; // Fetch a reasonable number of recent posts

    const url = `${INSTAGRAM_GRAPH_API_BASE_URL}/${API_VERSION}/me/media?fields=${fields}&limit=${limit}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;

    try {
        // 3. Fetch Data
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