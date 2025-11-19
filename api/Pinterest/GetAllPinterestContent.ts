/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Pinterest Environment Variables
const PINTEREST_API_BASE_URL: string | undefined = process.env.PINTEREST_API_BASE_URL; // e.g., https://api.pinterest.com/v5
const PINTEREST_ACCESS_TOKEN: string | undefined = process.env.PINTEREST_ACCESS_TOKEN; // OAuth 2.0 Access Token

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IPinterestMedia = {
    media_type: string;
    images?: {
        '236x'?: { url: string; width: number; height: number };
        '736x'?: { url: string; width: number; height: number };
    };
};

export type IPinterest = {
    id: string;
    link: string | null;
    title: string | null;
    description: string | null;
    created_at: string;
    media: IPinterestMedia;
    board_id: string;
};

type IRawPinsResponse = {
    items: IPinterest[];
    bookmark?: string;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXX Fetches recent Pins from a Pinterest account XXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Gets the recent Pins from the authenticated user's feed.
 */
export const getPinterestUserPins = async (limit: number = 10): Promise<IPinterest[]> => {
    if (!PINTEREST_API_BASE_URL || !PINTEREST_ACCESS_TOKEN) {
        throw new Error("Missing Pinterest API Base URL or Access Token.");
    }

    try {
        const fields = 'id,link,title,description,created_at,media,board_id';
        const url = `${PINTEREST_API_BASE_URL}/pins?fields=${fields}&page_size=${limit}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${PINTEREST_ACCESS_TOKEN}`,
            },
            next: { revalidate: 7200 }, // Cache for 2 hours
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Pinterest API Error (${response.status}): ${errorData?.message || 'Failed to fetch Pins.'}`);
        }

        const data: IRawPinsResponse = await response.json();
        
        return data.items;

    } catch (error) {
        console.error("Error fetching Pinterest Pins:", error);
        throw new Error("Failed to retrieve Pinterest content.");
    }
};