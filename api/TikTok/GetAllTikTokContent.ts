/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// TikTok Environment Variables
const TIKTOK_API_BASE_URL: string | undefined = process.env.TIKTOK_API_BASE_URL; 
const TIKTOK_ACCESS_TOKEN: string | undefined = process.env.TIKTOK_ACCESS_TOKEN; // Long-lived (refreshable) access token

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type ITikTokVideo = {
    id: string;
    cover_image_url: string;
    share_url: string;
    caption: string;
    like_count: number;
    comment_count: number;
    video_description: string;
};

/* Define a typed shape for the API response items to avoid `any` */
type TikTokApiVideo = {
    id: string;
    cover_image_url?: string;
    share_url?: string;
    title?: string;
    video_description?: string;
    like_count?: number;
    comment_count?: number;
};
        
/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXX Fetches recent videos from a TikTok user XXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export const getTikTokUserVideos = async (): Promise<ITikTokVideo[]> => {
    if (!TIKTOK_API_BASE_URL || !TIKTOK_ACCESS_TOKEN) {
        throw new Error("Missing TikTok API Base URL or Access Token.");
    }

    try {
        // NOTE: The /video/list endpoint is generally used to retrieve media uploaded by the currently authorized user.
        const url = `${TIKTOK_API_BASE_URL}/video/list/?fields=id,cover_image_url,share_url,title,video_description,like_count,comment_count,create_time&limit=10`;

        const response = await fetch(url, {
            method: 'POST', // TikTok requires POST for video list
            headers: {
                'Authorization': `Bearer ${TIKTOK_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}), // Empty body for default list
            next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`TikTok API Error (${response.status}): ${errorData?.error?.message || 'Failed to fetch user videos.'}`);
        }

        const data = await response.json();
        
        if (data?.data?.error_code !== 0) {
            throw new Error(`TikTok API Logic Error: ${data?.data?.description}`);
        }

        return (data.data.videos as TikTokApiVideo[]).map((video): ITikTokVideo => ({
            id: String(video.id),
            cover_image_url: video.cover_image_url || '',
            share_url: video.share_url || '',
            caption: video.title ?? (video.video_description ? video.video_description.substring(0, 50) + '...' : ''),
            like_count: Number(video.like_count ?? 0),
            comment_count: Number(video.comment_count ?? 0),
            video_description: video.video_description || '',
        }));

    } catch (error) {
        console.error("Error fetching TikTok videos:", error);
        throw new Error("Failed to retrieve TikTok video content.");
    }
};