/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Reddit Environment Variables
const REDDIT_API_BASE_URL: string | undefined = process.env.REDDIT_API_BASE_URL; 
const REDDIT_SUBREDDIT: string | undefined = process.env.REDDIT_SUBREDDIT; // e.g., "pics"
const REDDIT_ACCESS_TOKEN: string | undefined = process.env.REDDIT_ACCESS_TOKEN; // OAuth 2.0 Access Token

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export type IRedditPost = {
    id: string;
    title: string;
    author: string;
    subreddit: string;
    created_utc: number; // Unix timestamp
    url: string; // URL of the post (image, video, or link)
    permalink: string; // Reddit comments link
    num_comments: number;
    score: number;
    thumbnail: string; // Thumbnail image URL
    is_self: boolean; // Is a text post
    // The data object can contain many more fields; we map the core ones.
};

type IRawRedditResponse = {
    kind: string;
    data: {
        children: { kind: string, data: IRedditPost }[];
        after: string | null;
    };
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXX Fetches recent posts from a Reddit subreddit XXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Gets the top posts from a specified subreddit.
 */
export const getRedditSubredditPosts = async (limit: number = 10): Promise<IRedditPost[]> => {
    if (!REDDIT_API_BASE_URL || !REDDIT_ACCESS_TOKEN || !REDDIT_SUBREDDIT) {
        throw new Error("Missing Reddit environment variables.");
    }

    try {
        // Query the "hot" posts of the subreddit
        const url = `${REDDIT_API_BASE_URL}/r/${REDDIT_SUBREDDIT}/hot?limit=${limit}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${REDDIT_ACCESS_TOKEN}`,
                'User-Agent': 'YourAppName/1.0 (by /u/YourRedditUsername)', // Required by Reddit API
            },
            next: { revalidate: 600 }, // Cache for 10 minutes
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Reddit API Error (${response.status}): ${errorData?.message || 'Failed to fetch Reddit posts.'}`);
        }

        const data: IRawRedditResponse = await response.json();
        
        // Extract the 'data' object from each 'child' element
        return data.data.children.map(child => child.data);

    } catch (error) {
        console.error("Error fetching Reddit posts:", error);
        throw new Error("Failed to retrieve Reddit subreddit content.");
    }
};