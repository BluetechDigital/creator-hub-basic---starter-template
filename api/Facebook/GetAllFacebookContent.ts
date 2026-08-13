/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Facebook Environment Variables
const FACEBOOK_GRAPH_API_BASE_URL: string | undefined = process.env.FACEBOOK_GRAPH_API_BASE_URL;
const FACEBOOK_PAGE_ID: string | undefined = process.env.FACEBOOK_PAGE_ID;
const FACEBOOK_ACCESS_TOKEN: string | undefined = process.env.FACEBOOK_ACCESS_TOKEN; // Long-Lived Page Access Token

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IFBPostImage = {
    url: string;
};

export type IFacebookPost = {
    id: string;
    message: string;
    created_time: string;
    permalink_url: string;
    full_picture?: string; // URL for the associated image/video thumbnail
    attachments?: { // Media attachments
        data: {
            media: IFBPostImage;
            target: { id: string };
            type: string;
        }[];
    };
    shares?: { count: number };
    reactions?: { data: unknown[], summary: { total_count: number } };
};

type IRawFBPostsResponse = {
    data: IFacebookPost[];
    paging?: { next: string };
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXX Fetches recent posts from a Facebook Page XXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Fetches recent posts from a Facebook Page via the Graph API, using a
 * long-lived Page Access Token. Requests a curated set of `fields` (including
 * the post's link/image and reaction summary) rather than the full default
 * payload, to keep the response focused on what the feed UI needs.
 * @param limit Maximum number of posts to fetch.
 * @returns The page's most recent posts.
 */
export const getFacebookPagePosts = async (limit: number = 10): Promise<IFacebookPost[]> => {
    if (!FACEBOOK_GRAPH_API_BASE_URL || !FACEBOOK_ACCESS_TOKEN || !FACEBOOK_PAGE_ID) {
        throw new Error("Missing Facebook environment variables.");
    }

    try {
        // Fields request the core data and link/image for a cleaner feed
        const fields = 'id,message,created_time,permalink_url,full_picture,shares,attachments,reactions.summary(true)';
        const url = `${FACEBOOK_GRAPH_API_BASE_URL}/${FACEBOOK_PAGE_ID}/posts?fields=${fields}&limit=${limit}&access_token=${FACEBOOK_ACCESS_TOKEN}`;

        const response = await fetch(url, {
            next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Facebook API Error (${response.status}): ${errorData?.error?.message || 'Failed to fetch Facebook posts.'}`);
        }

        const data: IRawFBPostsResponse = await response.json();
        
        return data.data;

    } catch (error) {
        console.error("Error fetching Facebook posts:", error);
        throw new Error("Failed to retrieve Facebook page content.");
    }
};