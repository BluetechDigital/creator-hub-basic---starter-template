/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const YOUTUBE_API_BASE_URL: string | undefined = process.env.YOUTUBE_API;
const YOUTUBE_KEY: string | undefined = process.env.YOUTUBE_KEY;
const YOUTUBE_CHANNEL_ID: string | undefined = process.env.YOUTUBE_CHANNEL_ID;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Standard thumbnail structure used across YouTube API
type IThumbnail = {
    url: string;
    width: number;
    height: number;
};

// Raw response structure for the channel API call
type IRawChannelSnippet = {
    title: string;
    description: string;
    customUrl: string;
    publishedAt: string; // ISO 8601
    thumbnails: {
        default: IThumbnail;
        medium: IThumbnail;
        high: IThumbnail;
        standard?: IThumbnail;
        maxres?: IThumbnail;
    };
    defaultLanguage: string;
    localized: {
        title: string;
        description: string;
    };
    country: string;
};

// Final merged structure for Channel Info
export type IYoutubeChannelInfo = IRawChannelSnippet & {
    viewCount: string;
    subscriberCount: string;
    hiddenSubscriberCount: boolean;
    videoCount: string;
};

// Raw response structure for a single Playlist item from the /playlists endpoint
type IRawPlaylistItem = {
    id: string; // The playlist ID
    kind: string; 
    etag: string;
    snippet: Record<string, unknown>; // Contains title, thumbnails, etc., which we discard for the minimal final type
};

// Final Playlists structure
export type IYoutubePlaylists = {
    id: string;
}[];

// Raw structure for a single item from the /search endpoint
export type IRawSearchItem = {
    id: {
        videoId: string;
        kind: string;
    };
    [key: string]: unknown; // Includes snippet, etag, etc.
};

// Final Videos structure
export type IYoutubeVideos = {
    kind: string;
    etag: string;
    id: string;
    videoId: string;
    snippet: {
        publishedAt: string;
        channelId: string;
        title: string;
        description: string;
        thumbnails: {
            default: IThumbnail;
            medium: IThumbnail;
            high: IThumbnail;
            [key: string]: IThumbnail | undefined;
        };
        channelTitle: string;
        tags?: string[];
        categoryId: string;
        liveBroadcastContent: string;
        localized: {
            title: string;
            description: string;
        };
        defaultAudioLanguage?: string;
    };
    status: {
        uploadStatus: string;
        privacyStatus: string;
        license: string;
        embeddable: boolean;
        publicStatsViewable: boolean;
        madeForKids: boolean;
    };
    statistics: {
        viewCount: string;
        likeCount: string;
        favoriteCount: string;
        commentCount: string;
    };
}[];

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXX Youtube Channel Info XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export const getAllYoutubeChannelInfo = async (): Promise<IYoutubeChannelInfo> => {
    // 1. Defensive Checks
    if (!YOUTUBE_API_BASE_URL || !YOUTUBE_KEY || !YOUTUBE_CHANNEL_ID) {
        throw new Error("Missing YouTube environment variables (API_BASE_URL, KEY, or CHANNEL_ID).");
    }

    try {
        // IMPROVEMENT: Combine snippet and statistics into a single API call
        const url = `${YOUTUBE_API_BASE_URL}/channels?part=snippet,statistics&id=${YOUTUBE_CHANNEL_ID}&key=${YOUTUBE_KEY}`;
        
        // Use a single fetch call with a reasonable revalidation time
        const response = await fetch(url, {
            next: {revalidate: 86400}, // Cache Data for 24 Hours
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`YouTube API Error (${response.status}): ${errorData?.error?.message || 'Failed to fetch channel info.'}`);
        }

        const data = await response.json();
        const item = data?.items?.[0];

        if (!item) {
            throw new Error("Channel data not found for the provided ID.");
        }

        // Combine snippet and statistics into the final required object
        const channelInfo: IYoutubeChannelInfo = {
            ...item.snippet,
            ...item.statistics,
        };

        return channelInfo;
        
    } catch (error: unknown) {
        console.error("Error fetching YouTube channel info:", error);
        throw new Error(
            "Failed to fetch YouTube channel info content"
        );
    }
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX Youtube Playlists XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export const getAllYoutubePlaylists = async (): Promise<IYoutubePlaylists> => {
    // 1. Defensive Checks
    if (!YOUTUBE_API_BASE_URL || !YOUTUBE_KEY || !YOUTUBE_CHANNEL_ID) {
        throw new Error("Missing YouTube environment variables (API_BASE_URL, KEY, or CHANNEL_ID).");
    }

    try {
        const getPlaylistIdUrl = `${YOUTUBE_API_BASE_URL}/playlists?part=snippet&channelId=${YOUTUBE_CHANNEL_ID}&maxResults=50&key=${YOUTUBE_KEY}`;

        // Cache Data for 24 Hours before refetching
        const response = await fetch(getPlaylistIdUrl, {
            next: {revalidate: 86400},
        });

        if (!response.ok) {
             const errorData = await response.json();
            throw new Error(`YouTube API Error (${response.status}): ${errorData?.error?.message || 'Failed to fetch playlists.'}`);
        }

        const data = await response.json();

        // FIX: Explicitly assign to IRawPlaylistItem[] to resolve the "unused" type warning.
        const rawPlaylistItems: IRawPlaylistItem[] = data?.items || [];

        const playlistIDData: IYoutubePlaylists = rawPlaylistItems
            .map((item) => ({
                id: item.id // Direct mapping of the playlist ID
            }));

        return playlistIDData;

    } catch (error: unknown) {
        console.error("Error fetching YouTube playlists:", error);
        throw new Error(
            "Failed to fetch YouTube playlists content"
        );
    }
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Youtube Videos XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export const getAllYoutubeVideos = async (): Promise<IYoutubeVideos> => {
    // 1. Defensive Checks
    if (!YOUTUBE_API_BASE_URL || !YOUTUBE_KEY || !YOUTUBE_CHANNEL_ID) {
        throw new Error("Missing YouTube environment variables (API_BASE_URL, KEY, or CHANNEL_ID).");
    }
    
    try {
        // 1. Search for video IDs (max 50)
        const searchUrl = `${YOUTUBE_API_BASE_URL}/search?key=${YOUTUBE_KEY}&channelId=${YOUTUBE_CHANNEL_ID}&part=id&order=date&maxResults=50&type=video`;
        
        const searchResponse = await fetch(searchUrl, {
            next: { revalidate: 3600 }, // 1 hour cache
        });
        
        if (!searchResponse.ok) {
            const errorData = await searchResponse.json();
            throw new Error(`YouTube API Error (${searchResponse.status}): ${errorData?.error?.message || 'Failed to fetch video IDs.'}`);
        }

        const searchData = await searchResponse.json() as { items: IRawSearchItem[] };
        
        const videoIds = searchData.items.map((item) => item.id.videoId).join(',');
        
        if (!videoIds) {
            return [] as IYoutubeVideos; // Return empty array if no videos are found
        }

        // 2. Fetch full video details using the collected IDs
        const videosUrl = `${YOUTUBE_API_BASE_URL}/videos?part=snippet,statistics,status&id=${videoIds}&key=${YOUTUBE_KEY}`;

        const videoDetailsResponse = await fetch(videosUrl, {
            next: { revalidate: 3600 },
        });
        
        if (!videoDetailsResponse.ok) {
            const errorData = await videoDetailsResponse.json();
            throw new Error(`YouTube API Error (${videoDetailsResponse.status}): ${errorData?.error?.message || 'Failed to fetch video details.'}`);
        }

        const videoDetails = await videoDetailsResponse.json();
        
        // Final mapping and formatting
        const formattedVideos: IYoutubeVideos = videoDetails.items.map((video: IYoutubeVideos[number]) => ({
            ...video,
            // The /videos endpoint returns the ID under 'id', but we ensure 'videoId' exists for consistency
            videoId: video.id, 
        }));
        
        return formattedVideos;
        
    } catch (error: unknown) {
        console.error("Error fetching YouTube videos:", error);
        throw new Error(
            "Failed to retrieve YouTube videos content"
        );
    }
};