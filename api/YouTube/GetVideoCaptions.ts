/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import "server-only";
import { getYoutubeAccessToken } from "@/config/youtubeOAuth";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const YOUTUBE_API_BASE_URL: string | undefined = process.env.YOUTUBE_API_BASE_URL;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Caption Track Listing XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type ICaptionTrack = {
	id: string;
	snippet: {
		language: string;
		/** `"standard"` for a creator-uploaded/edited track, `"ASR"` for YouTube's auto-generated one. */
		trackKind: string;
	};
};

/**
 * Lists the caption tracks available for a video via `captions.list` — an
 * owner-only endpoint (unlike this app's other read-only, API-key-based
 * YouTube calls in `api/YouTube/GetAllYoutubeContent.ts`), hence the OAuth
 * access token rather than `YOUTUBE_KEY`.
 * @param videoId The video to list caption tracks for.
 * @param accessToken A fresh OAuth access token — see `getYoutubeAccessToken`.
 * @returns The video's caption tracks, or an empty array if it has none.
 */
const listCaptionTracks = async (videoId: string, accessToken: string): Promise<ICaptionTrack[]> => {
	const response = await fetch(`${YOUTUBE_API_BASE_URL}/captions?part=snippet&videoId=${videoId}`, {
		headers: { Authorization: `Bearer ${accessToken}` },
	});

	if (!response.ok) {
		throw new Error(`YouTube captions.list failed (${response.status}): ${await response.text()}`);
	}

	const data = (await response.json()) as { items?: ICaptionTrack[] };
	return data.items ?? [];
};

/**
 * Picks which caption track to transcribe from, when a video has more than
 * one: a real creator-uploaded/edited track (`trackKind !== "ASR"`) over
 * YouTube's auto-generated one, since a human-authored track is generally more
 * accurate; falls back to whatever's first (including an ASR track) rather
 * than giving up, since an auto-generated transcript is still far better raw
 * material for the rewrite step than none at all.
 * @param tracks The video's caption tracks, from `listCaptionTracks`.
 * @returns The chosen track, or `undefined` if `tracks` is empty.
 */
const selectCaptionTrack = (tracks: ICaptionTrack[]): ICaptionTrack | undefined =>
	tracks.find((track) => track.snippet.trackKind !== "ASR") ?? tracks[0];

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Caption Track Download XXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Downloads a single caption track as SRT text via `captions.download`.
 * @param captionId The caption track's id, from `listCaptionTracks`.
 * @param accessToken A fresh OAuth access token — see `getYoutubeAccessToken`.
 * @returns The raw SRT file contents.
 */
const downloadCaptionTrack = async (captionId: string, accessToken: string): Promise<string> => {
	const response = await fetch(`${YOUTUBE_API_BASE_URL}/captions/${captionId}?tfmt=srt`, {
		headers: { Authorization: `Bearer ${accessToken}` },
	});

	if (!response.ok) {
		throw new Error(`YouTube captions.download failed (${response.status}): ${await response.text()}`);
	}

	return response.text();
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX SRT Parsing XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Matches YouTube caption-track conventions for non-speech sound description
// (auto-generated tracks use these liberally on music/instrumental videos,
// e.g. "[Music]", "[Music playing]", "(applause continues)") — these aren't
// spoken content and would otherwise read as real transcript material to
// both `getVideoTranscript`'s substance check and the rewrite prompt itself.
const NON_SPEECH_MARKER_PATTERN = /[[(]\s*(music|applause|laughter|inaudible|silence|background noise)[^\])]*[\])]/gi;

/**
 * Reduces a raw SRT caption file down to plain, continuous transcript text —
 * dropping every cue's index number and `HH:MM:SS,mmm --> HH:MM:SS,mmm`
 * timestamp line (matched by pattern, not fixed line position, since a
 * malformed or multi-line cue block would otherwise silently drop real
 * spoken text), stripping any inline markup tags (e.g. `<i>`) and non-speech
 * sound-description markers (e.g. `[Music]` — see `NON_SPEECH_MARKER_PATTERN`),
 * and collapsing the whole thing to single-spaced prose ready to hand to the
 * article-rewrite step — a raw SRT dump has neither sentence structure nor
 * paragraph breaks, both of which `generateArticleFromTranscript` is
 * responsible for imposing, not this parser.
 * @param srt Raw SRT file contents, as returned by `downloadCaptionTrack`.
 * @returns The transcript as plain text, or an empty string if `srt` contains no cue text.
 */
export const parseSrtToPlainText = (srt: string): string => {
	const blocks = srt.replace(/\r\n/g, "\n").trim().split(/\n\s*\n/);

	const cueTexts = blocks.map((block) => {
		const textLines = block
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line && !/^\d+$/.test(line) && !line.includes("-->"));

		return textLines.join(" ");
	});

	return cueTexts
		.filter(Boolean)
		.join(" ")
		.replace(/<[^>]+>/g, "")
		.replace(NON_SPEECH_MARKER_PATTERN, "")
		.replace(/\s+/g, " ")
		.trim();
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Video Transcript XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Below this many words, a transcript isn't real source material — confirmed
// live: a music-only video's caption track (nothing but "[Music]" markers,
// stripped to an empty/near-empty string by the pattern above) still reached
// the rewrite step, and rather than skipping it, Claude correctly followed
// its "don't invent details" instruction by writing an article *about* the
// absence of spoken content instead of the video itself — technically
// faithful to the transcript, but not a usable article. Gating here, before
// spending an Anthropic call, treats "not enough to write about" the same as
// "no captions at all" rather than publishing a draft that explains why it
// has nothing to say.
const MIN_TRANSCRIPT_WORD_COUNT = 40;

/**
 * Fetches a plain-text transcript for a video: lists its caption tracks,
 * picks the best one (`selectCaptionTrack`), downloads it, and reduces it to
 * plain text (`parseSrtToPlainText`). Used by
 * `app/api/videos/generate-articles/route.ts` as the source material for
 * `generateArticleFromTranscript`.
 * @param videoId The video to transcribe.
 * @returns The transcript as plain text, or `undefined` if the video has no
 * caption tracks, or its only track produced no usable text, or what's left
 * after stripping non-speech markers falls under `MIN_TRANSCRIPT_WORD_COUNT`
 * — none of these are an error state, callers should skip that video rather
 * than fail the whole run.
 */
export const getVideoTranscript = async (videoId: string): Promise<string | undefined> => {
	if (!YOUTUBE_API_BASE_URL) throw new Error("Missing YOUTUBE_API_BASE_URL environment variable.");

	const accessToken = await getYoutubeAccessToken();
	const tracks = await listCaptionTracks(videoId, accessToken);
	const track = selectCaptionTrack(tracks);

	if (!track) return undefined;

	const srt = await downloadCaptionTrack(track.id, accessToken);
	const transcript = parseSrtToPlainText(srt);

	if (!transcript) return undefined;

	const wordCount = transcript.split(/\s+/).filter(Boolean).length;
	if (wordCount < MIN_TRANSCRIPT_WORD_COUNT) return undefined;

	return transcript;
};
