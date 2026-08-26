/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const YOUTUBE_API_BASE_URL: string | undefined = process.env.YOUTUBE_API_BASE_URL;
const YOUTUBE_KEY: string | undefined = process.env.YOUTUBE_KEY;
const YOUTUBE_CHANNEL_ID: string | undefined = process.env.YOUTUBE_CHANNEL_ID;
// Optional: skips the contentDetails lookup below when a specific playlist is already known.
const YOUTUBE_PLAYLIST_ID: string | undefined = process.env.YOUTUBE_PLAYLIST_ID;
const REVALIDATE_TIME = 86400; // Helper for consistent revalidation time, Cache Data for (24 Hours)

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
    snippet: { title: string; [key: string]: unknown }; // title is kept; thumbnails etc. are discarded for the minimal final type
};

// Final Playlists structure
export type IYoutubePlaylists = {
    id: string;
    title: string;
}[];

// Raw response structure for the channel API call when resolving the uploads playlist ID
type IRawChannelContentDetails = {
    contentDetails: {
        relatedPlaylists: {
            uploads: string;
        };
    };
};

// Raw structure for a single item from the /playlistItems endpoint (contentDetails only)
type IRawPlaylistItemContentDetails = {
    contentDetails: {
        videoId: string;
    };
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
    contentDetails: {
        duration: string; // ISO 8601, e.g. "PT4M13S" — see iso8601DurationToSeconds
        dimension: string; // "2d" | "3d"
        definition: string; // "hd" | "sd"
        caption: string; // "true" | "false" (string, per the API)
        licensedContent: boolean;
        projection: string; // "rectangular" | "360"
    };
    player: {
        embedHtml: string;
    };
    // Sparse in practice — most uploads never populate these.
    topicDetails?: {
        topicCategories?: string[];
    };
    liveStreamingDetails?: {
        actualStartTime?: string;
        actualEndTime?: string;
        scheduledStartTime?: string;
        scheduledEndTime?: string;
        concurrentViewers?: string;
    };
    recordingDetails?: {
        recordingDate?: string;
        location?: {
            latitude?: number;
            longitude?: number;
            altitude?: number;
        };
    };
    localizations?: Record<string, { title: string; description: string }>;
}[];

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX ISO 8601 Duration XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Parses YouTube's ISO 8601 duration format (e.g. "PT1H2M3S") into a plain
 * number of seconds, so callers can, e.g., tell Shorts (<=60s) apart from
 * regular uploads without a second API call.
 * @param duration An ISO 8601 duration string as returned by the YouTube Data API
 * (e.g. "PT4M13S").
 * @returns The total duration in seconds. Returns 0 if the string doesn't match
 * the expected format.
 */
export const iso8601DurationToSeconds = (duration: string): number => {
    const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);

    if (!match) {
        return 0;
    }

    const [, hours, minutes, seconds] = match;

    return (Number(hours) || 0) * 3600 + (Number(minutes) || 0) * 60 + (Number(seconds) || 0);
};

/**
 * Formats a YouTube statistics count (given as a numeric string by the API) into
 * short form (e.g. "12500" -> "12.5K"). Shared by `VideoCard.tsx` and `VideoHero.tsx`
 * — colocated here with the other small YouTube-specific pure-function helpers rather
 * than duplicated per component.
 * @param value A statistics count as returned by the YouTube Data API (e.g. `video.statistics.viewCount`).
 */
export const formatCount = (value: string): string => {
    const number = Number(value);

    if (!Number.isFinite(number)) return value;
    if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(1)}M`;
    if (number >= 1_000) return `${(number / 1_000).toFixed(1)}K`;

    return String(number);
};

// YouTube video IDs are always exactly this many characters — the fixed
// length `buildVideoSlug`/`getVideoIdFromSlug` below rely on.
const YOUTUBE_VIDEO_ID_LENGTH = 11;

/**
 * Builds a readable `/videos/[slug]` URL segment for a video: its title,
 * slugified, with the real video ID appended as a fixed-length suffix — e.g.
 * `funniest-posts-on-the-internet-ep-627-RQlRGCrzCEY`. The ID suffix is what
 * makes this collision-free by construction (no two videos can ever produce
 * the same slug, even with identical titles) and keeps a single-video page's
 * lookup as cheap as a direct ID fetch (`getVideoIdFromSlug` below just reads
 * the last 11 characters back off — no catalog-wide title search needed,
 * unlike a pure-title-slug scheme would require).
 * @param title The video's title.
 * @param videoId The video's YouTube ID.
 * @returns The slug, or just `videoId` if the title has nothing left after
 * stripping (e.g. a title made entirely of symbols/emoji).
 */
export const buildVideoSlug = (title: string, videoId: string): string => {
    const titleSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/[\s-]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return titleSlug ? `${titleSlug}-${videoId}` : videoId;
};

/**
 * Recovers a video ID from a `/videos/[slug]` route param built by
 * `buildVideoSlug` — since IDs are a fixed length, the ID is simply the
 * slug's last `YOUTUBE_VIDEO_ID_LENGTH` characters, regardless of what the
 * title-derived prefix contains (including hyphens, which a real video ID
 * can also legitimately contain, e.g. `tC-u-bYWaRc` — ruling out "split on
 * the last hyphen" as a parsing strategy). This also means a bare
 * `/videos/{id}` link (this route's older URL shape, or whatever's in an
 * older cached sitemap/bookmark) keeps resolving correctly: a bare ID's own
 * last `YOUTUBE_VIDEO_ID_LENGTH` characters are just itself.
 * @param slug The route's raw `[slug]` param.
 * @returns The video ID, or `undefined` if `slug` is too short to contain one.
 */
export const getVideoIdFromSlug = (slug: string): string | undefined => {
    if (slug.length < YOUTUBE_VIDEO_ID_LENGTH) return undefined;
    return slug.slice(-YOUTUBE_VIDEO_ID_LENGTH);
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXX Youtube Channel Info XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Fetches the channel's public profile and combines it with its statistics
 * (view/subscriber/video counts) into a single flattened object. Requests both
 * the `snippet` and `statistics` parts in one `channels.list` call rather than
 * two separate requests, since the API allows combining `part` values at no
 * extra quota cost.
 * @returns The channel's snippet fields merged with its statistics fields.
 */
export const getAllYoutubeChannelInfo = async (): Promise<IYoutubeChannelInfo> => {
    // 1. Defensive Checks
    if (!YOUTUBE_API_BASE_URL || !YOUTUBE_KEY || !YOUTUBE_CHANNEL_ID) {
        throw new Error("Missing YouTube environment variables (YOUTUBE_API_BASE_URL, YOUTUBE_KEY, or YOUTUBE_CHANNEL_ID).");
    }

    try {
        const url = `${YOUTUBE_API_BASE_URL}/channels?part=snippet,statistics&id=${YOUTUBE_CHANNEL_ID}&key=${YOUTUBE_KEY}`;
        
        // Use a single fetch call with a reasonable revalidation time
        const response = await fetch(url, {
            next: {revalidate: REVALIDATE_TIME},
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

/**
 * Fetches up to 50 of the channel's playlists, reduced to just `id` and
 * `title` — the rest of the `snippet` payload (thumbnails, description, etc.)
 * is discarded since callers only need the ID (to look up a playlist's
 * contents) and the title (for a playlist filter's option labels, e.g.
 * `VideosGrid.tsx`).
 * @returns An array of `{ id, title }` objects, one per playlist. Empty array
 * if the channel has no playlists.
 */
export const getAllYoutubePlaylists = async (): Promise<IYoutubePlaylists> => {
    // 1. Defensive Checks
    if (!YOUTUBE_API_BASE_URL || !YOUTUBE_KEY || !YOUTUBE_CHANNEL_ID) {
        throw new Error("Missing YouTube environment variables (YOUTUBE_API_BASE_URL, YOUTUBE_KEY, or YOUTUBE_CHANNEL_ID).");
    }

    try {
        const getPlaylistIdUrl = `${YOUTUBE_API_BASE_URL}/playlists?part=snippet&channelId=${YOUTUBE_CHANNEL_ID}&maxResults=50&key=${YOUTUBE_KEY}`;

        // Cache Data for 24 Hours before refetching
        const response = await fetch(getPlaylistIdUrl, {
            next: {revalidate: REVALIDATE_TIME},
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
                id: item.id,
                title: item.snippet.title,
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
XXXXXXXXXXXXXXXXXXXXXXXXX Youtube Uploads Playlist ID XXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Resolves the channel's "uploads" playlist ID so getAllYoutubeVideos() can list
 * videos via playlistItems.list instead of search.list — the latter costs 100
 * quota units/call vs. 1, which matters since this file gets copied into every
 * client fork of this template.
 * @returns The uploads playlist ID. Uses YOUTUBE_PLAYLIST_ID directly if set,
 * skipping the lookup entirely; otherwise resolves it via channels.list (1 unit).
 */
const resolveUploadsPlaylistId = async (): Promise<string> => {
    if (YOUTUBE_PLAYLIST_ID) {
        return YOUTUBE_PLAYLIST_ID;
    }

    const channelUrl = `${YOUTUBE_API_BASE_URL}/channels?part=contentDetails&id=${YOUTUBE_CHANNEL_ID}&key=${YOUTUBE_KEY}`;

    const channelResponse = await fetch(channelUrl, {
        next: { revalidate: REVALIDATE_TIME },
    });

    if (!channelResponse.ok) {
        const errorData = await channelResponse.json();
        throw new Error(`YouTube API Error (${channelResponse.status}): ${errorData?.error?.message || 'Failed to resolve uploads playlist.'}`);
    }

    const channelData = await channelResponse.json() as { items: IRawChannelContentDetails[] };
    const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
        throw new Error("Could not resolve the channel's uploads playlist ID.");
    }

    return uploadsPlaylistId;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Youtube Videos XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IRawPlaylistItemsPage = {
    items: IRawPlaylistItemContentDetails[];
    nextPageToken?: string;
};

/**
 * Fetches one raw page (up to 50 items) of a playlist's contents via
 * playlistItems.list — shared by `getAllYoutubeVideos`, `getYoutubeVideosPage`,
 * and `getPlaylistVideoIds`, all of which need "one page of this playlist's
 * video IDs, optionally resuming from a token" and previously each built this
 * URL/fetch themselves.
 * @param playlistId The playlist to list items for.
 * @param pageToken Optional token to resume from a previous page; omitted for the first page.
 * @returns The page's raw items plus a `nextPageToken` if more pages exist.
 */
const fetchPlaylistItemsPage = async (playlistId: string, pageToken?: string): Promise<IRawPlaylistItemsPage> => {
    const pageTokenParam = pageToken ? `&pageToken=${pageToken}` : '';
    const url = `${YOUTUBE_API_BASE_URL}/playlistItems?part=contentDetails&playlistId=${playlistId}&maxResults=50${pageTokenParam}&key=${YOUTUBE_KEY}`;

    const response = await fetch(url, {
        next: { revalidate: REVALIDATE_TIME },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`YouTube API Error (${response.status}): ${errorData?.error?.message || 'Failed to fetch video IDs.'}`);
    }

    const data = await response.json() as { items?: IRawPlaylistItemContentDetails[]; nextPageToken?: string };

    return { items: data.items ?? [], nextPageToken: data.nextPageToken };
};

/**
 * Fetches full details for a batch of video IDs via videos.list, requesting every
 * `part` a public API-key request can actually read — snippet, statistics, status,
 * contentDetails, player, topicDetails, liveStreamingDetails, recordingDetails, and
 * localizations — since videos.list costs a flat 1 unit regardless of how many parts
 * are requested, so there's no quota reason to ask for less. Owner-only parts
 * (fileDetails, processingDetails, suggestions) are deliberately excluded because
 * they require OAuth plus video ownership and don't work with this app's read-only
 * API-key access. Shared by `getAllYoutubeVideos` and `getYoutubeVideosPage`.
 * @param videoIds The video IDs to fetch details for.
 * @returns Full details for each ID, augmented with a `videoId` field (mirroring
 * `id`) for consistency with other video shapes used elsewhere in the app. Empty
 * array (no fetch made) if `videoIds` is empty.
 */
const fetchVideoDetailsByIds = async (videoIds: string[]): Promise<IYoutubeVideos> => {
    if (!videoIds.length) {
        return [] as IYoutubeVideos;
    }

    const videosUrl = `${YOUTUBE_API_BASE_URL}/videos?part=snippet,statistics,status,contentDetails,player,topicDetails,liveStreamingDetails,recordingDetails,localizations&id=${videoIds.join(',')}&key=${YOUTUBE_KEY}`;

    const response = await fetch(videosUrl, {
        next: { revalidate: 3600 },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`YouTube API Error (${response.status}): ${errorData?.error?.message || 'Failed to fetch video details.'}`);
    }

    const data = await response.json() as { items?: IYoutubeVideos };

    return (data.items ?? []).map((video) => ({
        ...video,
        // The /videos endpoint returns the ID under 'id', but we ensure 'videoId' exists for consistency
        videoId: video.id,
    }));
};

/**
 * Fetches full details for every video in the channel's uploads playlist (up to
 * YouTube's 50-per-request cap — see `getYoutubeVideosPage` for fetching further
 * than that). Runs in two quota-conscious steps via the shared
 * `fetchPlaylistItemsPage`/`fetchVideoDetailsByIds` helpers: (1) lists video IDs via
 * playlistItems.list (1 quota unit) instead of search.list (100 units/call), then
 * (2) fetches full details for those IDs via videos.list.
 * @returns Full video details for the 50 most recent uploads. Empty array if the
 * playlist has no videos.
 */
export const getAllYoutubeVideos = async (): Promise<IYoutubeVideos> => {
    // 1. Defensive Checks
    if (!YOUTUBE_API_BASE_URL || !YOUTUBE_KEY || !YOUTUBE_CHANNEL_ID) {
        throw new Error("Missing YouTube environment variables (YOUTUBE_API_BASE_URL, YOUTUBE_KEY, or YOUTUBE_CHANNEL_ID).");
    }

    try {
        const uploadsPlaylistId = await resolveUploadsPlaylistId();
        const { items } = await fetchPlaylistItemsPage(uploadsPlaylistId);
        const videoIds = items.map((item) => item.contentDetails.videoId);

        return await fetchVideoDetailsByIds(videoIds);

    } catch (error: unknown) {
        console.error("Error fetching YouTube videos:", error);
        throw new Error(
            "Failed to retrieve YouTube videos content"
        );
    }
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Youtube Videos (paginated) XXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export type IYoutubeVideosPage = {
    videos: IYoutubeVideos;
    /** Pass this back in as `pageToken` to fetch the next page; absent once the catalog is exhausted. */
    nextPageToken?: string;
};

type IResumeToken = {
    /** The raw YouTube playlistItems.list token to fetch the *next* untouched raw page from — absent once the raw catalog itself is exhausted. */
    rawPageToken?: string;
    /** Qualifying video IDs already fetched (from a previous call's raw page) but not yet returned to a caller — drained before fetching any further raw pages. */
    leftoverVideoIds: string[];
};

/**
 * `getYoutubeVideosPage`'s `nextPageToken` is a small opaque JSON string (not a
 * raw YouTube token) — see that function's doc comment for why it needs to
 * carry more than just YouTube's own token.
 */
const encodeResumeToken = (token: IResumeToken): string => JSON.stringify(token);

const decodeResumeToken = (pageToken?: string): IResumeToken => {
    if (!pageToken) return { leftoverVideoIds: [] };

    try {
        const parsed = JSON.parse(pageToken) as Partial<IResumeToken>;
        return { rawPageToken: parsed.rawPageToken, leftoverVideoIds: parsed.leftoverVideoIds ?? [] };
    } catch {
        // A malformed/foreign token starts over rather than throwing — this only
        // backs a "Show more" click, not something worth failing the page over.
        return { leftoverVideoIds: [] };
    }
};

/**
 * Fetches a page of the channel's uploads beyond `getAllYoutubeVideos`'s fixed
 * 50-item cap, following YouTube's raw `nextPageToken` across as many
 * playlistItems.list pages (50 items each) as needed. Real pagination is
 * needed here specifically because duration — which `minDurationSeconds`
 * filters on — is only known after the follow-up videos.list call, so a
 * single raw page of 50 playlist items doesn't line up with `targetCount` in
 * either direction: it can contain far fewer than `targetCount` qualifying
 * videos (a page mostly made up of Shorts), or, just as easily for a channel
 * where most uploads are already long-form, far *more* (confirmed live: a
 * first naive version of this function returned 50 videos for a `targetCount`
 * of 12, because the very first raw page alone already had that many
 * qualifying videos).
 *
 * So this **does** truncate the result to exactly `targetCount` (never more)
 * — but rather than discarding the extra qualifying videos a raw page
 * produced beyond that (which would silently and permanently lose them, since
 * YouTube's own token only ever advances to the *next* raw page), the excess
 * is carried forward inside this function's own `nextPageToken`: an opaque
 * JSON string encoding both the raw YouTube token to resume raw pagination
 * from *and* the leftover already-fetched qualifying video IDs to drain
 * first, before fetching any further raw pages. A later call re-fetches those
 * leftover IDs' full details (a small extra `videos.list` cost, still 1 quota
 * unit) rather than this function trying to cache full video payloads inside
 * the token itself.
 * @param options.pageToken Resume token from a previous call's `nextPageToken`; omitted for the first page.
 * @param options.targetCount Exact number of qualifying videos to return (fewer only if the catalog is exhausted first).
 * @param options.minDurationSeconds When set, only videos longer than this (in seconds) count toward `targetCount` — e.g. `60` to exclude Shorts.
 * @returns Exactly `targetCount` videos (or fewer, once exhausted) and a `nextPageToken` to resume from, or `undefined` once nothing is left.
 */
export const getYoutubeVideosPage = async ({
    pageToken,
    targetCount,
    minDurationSeconds,
}: {
    pageToken?: string;
    targetCount: number;
    minDurationSeconds?: number;
}): Promise<IYoutubeVideosPage> => {
    // 1. Defensive Checks
    if (!YOUTUBE_API_BASE_URL || !YOUTUBE_KEY || !YOUTUBE_CHANNEL_ID) {
        throw new Error("Missing YouTube environment variables (YOUTUBE_API_BASE_URL, YOUTUBE_KEY, or YOUTUBE_CHANNEL_ID).");
    }

    try {
        const uploadsPlaylistId = await resolveUploadsPlaylistId();
        const { rawPageToken, leftoverVideoIds } = decodeResumeToken(pageToken);

        // Full video objects for every qualifying ID gathered so far this call,
        // keyed by ID so the leftover-vs-returned split below never needs to
        // re-fetch details for videos already fetched within this same call.
        const videosById = new Map<string, IYoutubeVideos[number]>();

        if (leftoverVideoIds.length) {
            for (const video of await fetchVideoDetailsByIds(leftoverVideoIds)) {
                videosById.set(video.videoId, video);
            }
        }

        let currentRawPageToken = rawPageToken;

        while (videosById.size < targetCount) {
            const page = await fetchPlaylistItemsPage(uploadsPlaylistId, currentRawPageToken);
            const videoIds = page.items.map((item) => item.contentDetails.videoId);
            const videos = await fetchVideoDetailsByIds(videoIds);

            const qualifying = minDurationSeconds === undefined
                ? videos
                : videos.filter((video) => iso8601DurationToSeconds(video.contentDetails.duration) > minDurationSeconds);

            for (const video of qualifying) videosById.set(video.videoId, video);

            currentRawPageToken = page.nextPageToken;
            if (!currentRawPageToken) break;
        }

        const allIds = [...videosById.keys()];
        const pageVideoIds = allIds.slice(0, targetCount);
        const overflowVideoIds = allIds.slice(targetCount);

        const videos = pageVideoIds.map((id) => videosById.get(id)!);
        const hasMore = overflowVideoIds.length > 0 || Boolean(currentRawPageToken);

        return {
            videos,
            nextPageToken: hasMore
                ? encodeResumeToken({ rawPageToken: currentRawPageToken, leftoverVideoIds: overflowVideoIds })
                : undefined,
        };

    } catch (error: unknown) {
        console.error("Error fetching a page of YouTube videos:", error);
        throw new Error(
            "Failed to retrieve YouTube videos content"
        );
    }
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX Single Youtube Video XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Fetches full details for a single video by its ID — used by
 * `app/videos/[slug]/page.tsx` to resolve the video a `/videos/{videoId}`
 * route is for. Same `part=` list as `getAllYoutubeVideos` (1 quota unit
 * regardless of how many parts are requested).
 * @param videoId The YouTube video ID to fetch.
 * @returns The video's full details, or `undefined` if the ID doesn't
 * resolve to a video (deleted, private, or simply invalid — the API returns
 * an empty `items` array for this case, not an error status). Still throws on
 * a genuine network/API failure, same as `getAllYoutubeVideos` — callers
 * catch that themselves and treat it the same as `undefined` (see
 * `getPostContentBySlug`'s equivalent pattern for single blog posts).
 */
export const getYoutubeVideoById = async (videoId: string): Promise<IYoutubeVideos[number] | undefined> => {
    // 1. Defensive Checks
    if (!YOUTUBE_API_BASE_URL || !YOUTUBE_KEY) {
        throw new Error("Missing YouTube environment variables (YOUTUBE_API_BASE_URL or YOUTUBE_KEY).");
    }

    try {
        const url = `${YOUTUBE_API_BASE_URL}/videos?part=snippet,statistics,status,contentDetails,player,topicDetails,liveStreamingDetails,recordingDetails,localizations&id=${videoId}&key=${YOUTUBE_KEY}`;

        const response = await fetch(url, {
            next: { revalidate: REVALIDATE_TIME },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`YouTube API Error (${response.status}): ${errorData?.error?.message || 'Failed to fetch video.'}`);
        }

        const data = await response.json();
        const item = data?.items?.[0];

        if (!item) {
            return undefined;
        }

        return { ...item, videoId: item.id };

    } catch (error: unknown) {
        console.error(`Error fetching YouTube video ${videoId}:`, error);
        throw new Error("Failed to fetch YouTube video content");
    }
};

/**
 * Fetches full details for a specific, known set of video IDs — the public,
 * validated counterpart to the private `fetchVideoDetailsByIds` helper (same
 * env-var guard/error shape every other exported function in this file has).
 * Used by `AllYoutubeVideos.tsx` to resolve one archive page's exact video
 * slice (computed from `getAllQualifyingVideoIds`'s full ordered ID list)
 * into full video data, without needing to walk any playlist pagination at
 * request time — the IDs are already known.
 * @param videoIds The exact video IDs to fetch (e.g. one page's worth, ≤50).
 * @returns Full details for each ID, in the order YouTube's API returns them
 * (not necessarily the order `videoIds` was given in — callers that need a
 * specific order should re-sort by `videoId`). Empty array if `videoIds` is empty.
 */
export const getYoutubeVideosByIds = async (videoIds: string[]): Promise<IYoutubeVideos> => {
    // 1. Defensive Checks
    if (!YOUTUBE_API_BASE_URL || !YOUTUBE_KEY) {
        throw new Error("Missing YouTube environment variables (YOUTUBE_API_BASE_URL or YOUTUBE_KEY).");
    }

    try {
        return await fetchVideoDetailsByIds(videoIds);

    } catch (error: unknown) {
        console.error("Error fetching YouTube videos by ID:", error);
        throw new Error("Failed to retrieve YouTube videos content");
    }
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX Playlist Video Membership XXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Fetches *every* video ID belonging to a single playlist, following
 * `nextPageToken` across as many raw pages as needed — NOT capped at 50.
 * Capping this was the confirmed root cause of the playlist filter matching
 * almost nothing for any playlist bigger than one raw page: comparing this
 * function's old 50-item output against `getAllYoutubeVideos`'s displayed
 * 50-item window for a real 281-item playlist showed only 5 IDs in common,
 * since the two were independently-paginated, mismatched windows. Fully
 * enumerating membership here (cheap — 1 quota unit per 50 items) fixes that
 * regardless of how the video grid itself paginates. Used to build the
 * `playlistId → video IDs` membership map `VideosGrid.tsx`'s playlist filter
 * needs, since `getAllYoutubePlaylists()` only knows playlist id/title, not
 * membership.
 *
 * Deliberately never throws — this backs an optional filter, not the main
 * video feed, so a failure partway through one playlist's pagination should
 * only cost that playlist's filter option, not the whole page. Callers get an
 * empty array on any failure (missing env vars, network error, bad response).
 * @param playlistId The playlist to list video IDs for.
 * @returns Every video ID in the playlist, or an empty array on any failure.
 */
export const getPlaylistVideoIds = async (playlistId: string): Promise<string[]> => {
    try {
        if (!YOUTUBE_API_BASE_URL || !YOUTUBE_KEY) {
            console.error("Missing YouTube environment variables (YOUTUBE_API_BASE_URL or YOUTUBE_KEY).");
            return [];
        }

        const videoIds: string[] = [];
        let pageToken: string | undefined;

        do {
            const page = await fetchPlaylistItemsPage(playlistId, pageToken);
            videoIds.push(...page.items.map((item) => item.contentDetails.videoId));
            pageToken = page.nextPageToken;
        } while (pageToken);

        return videoIds;

    } catch (error: unknown) {
        console.error(`Error fetching video IDs for playlist ${playlistId}:`, error);
        return [];
    }
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX All Qualifying Video IDs (full walk) XXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export type IQualifyingVideoSummary = {
    videoId: string;
    /** ISO 8601 upload date — e.g. for `app/sitemap.ts`'s `lastmod`. */
    publishedAt: string;
    /** For building this video's `/videos/[slug]` URL via `buildVideoSlug` — e.g. `app/sitemap.ts`'s `<loc>`. */
    title: string;
};

/**
 * Walks the *entire* configured playlist once, filters by duration, and
 * returns a summary (`videoId` + `publishedAt` + `title`) for every
 * qualifying video, deduplicated, in the playlist's own order.
 *
 * This one walk is what makes real numbered pagination possible against an
 * API that's otherwise sequential-cursor-only (YouTube's `playlistItems.list`
 * has no "give me page 5" — only "here's a token, give me the next 50"):
 * - **Exact total page count** — `result.length`, not an estimate derived
 *   from the API's own `pageInfo.totalResults`, which counts every raw
 *   playlist item (Shorts included) rather than just the qualifying ones a
 *   page actually needs.
 * - **Exact "jump to page N"** — a caller slices the exact ID range for page
 *   N directly out of this array, then resolves full details for just that
 *   slice via `getYoutubeVideosByIds` — no sequential walk needed at request
 *   time, since the ordering is already known.
 * - **Correct playlist-filter options** (`AllYoutubeVideos.tsx`) — intersect
 *   each playlist's full membership (`getPlaylistVideoIds`) against this
 *   list once; a filter option is only shown if the intersection is
 *   non-empty, rather than offering every channel playlist indiscriminately
 *   (confirmed live: some playlists have zero overlap with the configured
 *   video source, making them silently match nothing before this fix).
 * - **The sitemap** (`app/sitemap.ts`) — `videoId` for the URL, `publishedAt`
 *   for `lastmod`, without a second full-catalog walk just to get dates
 *   `getAllQualifyingVideoIds` (below) would otherwise have discarded.
 *
 * Deduplicates by `videoId` (a `Map`, not a plain array) — a playlist can
 * genuinely contain the same video more than once (e.g. added twice by
 * mistake), which would otherwise carry a duplicate ID all the way through to
 * a duplicate `key` on two `VideoCard`s for the same video (confirmed live:
 * this is exactly what a React "two children with the same key" warning was
 * catching before this fix).
 *
 * Cost: one full walk (~1 quota unit per 50 raw items, plus 1 per 50 for the
 * duration-check videos.list calls) the first time a page is requested — not
 * a new caching layer, just relying on the same `next: {revalidate: 86400}`
 * fetch-level caching every underlying call here already has, so repeat
 * requests within that window are served from Next's fetch cache rather than
 * re-walking the whole catalog.
 * @param options.minDurationSeconds When set, only videos longer than this (in seconds) are included — e.g. `60` to exclude Shorts.
 * @returns Every qualifying video's `{videoId, publishedAt, title}`, deduplicated, in the playlist's own order.
 */
export const getAllQualifyingVideoSummaries = async ({
    minDurationSeconds,
}: {
    minDurationSeconds?: number;
} = {}): Promise<IQualifyingVideoSummary[]> => {
    // 1. Defensive Checks
    if (!YOUTUBE_API_BASE_URL || !YOUTUBE_KEY || !YOUTUBE_CHANNEL_ID) {
        throw new Error("Missing YouTube environment variables (YOUTUBE_API_BASE_URL, YOUTUBE_KEY, or YOUTUBE_CHANNEL_ID).");
    }

    try {
        const uploadsPlaylistId = await resolveUploadsPlaylistId();

        const qualifying = new Map<string, IQualifyingVideoSummary>();
        let pageToken: string | undefined;

        do {
            const page = await fetchPlaylistItemsPage(uploadsPlaylistId, pageToken);
            const videoIds = page.items.map((item) => item.contentDetails.videoId);
            const videos = await fetchVideoDetailsByIds(videoIds);

            const matching = minDurationSeconds === undefined
                ? videos
                : videos.filter((video) => iso8601DurationToSeconds(video.contentDetails.duration) > minDurationSeconds);

            for (const video of matching) {
                qualifying.set(video.videoId, {
                    videoId: video.videoId,
                    publishedAt: video.snippet.publishedAt,
                    title: video.snippet.title,
                });
            }
            pageToken = page.nextPageToken;

        } while (pageToken);

        return [...qualifying.values()];

    } catch (error: unknown) {
        console.error("Error walking the full YouTube video catalog:", error);
        throw new Error("Failed to retrieve the full YouTube video catalog");
    }
};

/**
 * Thin convenience wrapper around `getAllQualifyingVideoSummaries` for
 * callers (`AllYoutubeVideos.tsx`) that only need the IDs, not the dates.
 * @param options.minDurationSeconds Passed straight through — see `getAllQualifyingVideoSummaries`.
 * @returns Every qualifying video ID, deduplicated, in the playlist's own order.
 */
export const getAllQualifyingVideoIds = async (
    options: { minDurationSeconds?: number } = {},
): Promise<string[]> => {
    const summaries = await getAllQualifyingVideoSummaries(options);
    return summaries.map((summary) => summary.videoId);
};