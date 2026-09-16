import { describe, it, expect, afterEach, vi } from "vitest";

const { mockGetAccessToken } = vi.hoisted(() => ({ mockGetAccessToken: vi.fn() }));

vi.mock("@/config/youtubeOAuth", () => ({
	getYoutubeAccessToken: mockGetAccessToken,
}));

const originalEnv = { ...process.env };

const importFresh = async () => {
	vi.resetModules();
	return import("./GetVideoCaptions");
};

const setEnv = () => {
	process.env.YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";
};

const SAMPLE_SRT = [
	"1",
	"00:00:00,000 --> 00:00:02,500",
	"Hello and welcome",
	"",
	"2",
	"00:00:02,500 --> 00:00:05,000",
	"to this <i>video</i>.",
	"",
].join("\n");

// 48 words of real cue text — above MIN_TRANSCRIPT_WORD_COUNT, for tests that
// exercise getVideoTranscript's full pipeline (track selection, download)
// rather than the substance gate itself.
const LONG_SAMPLE_SRT = [
	"1",
	"00:00:00,000 --> 00:00:04,000",
	"Welcome back to the channel everyone today we are going to walk through",
	"",
	"2",
	"00:00:04,000 --> 00:00:08,000",
	"a really detailed breakdown of how this entire project actually came together",
	"",
	"3",
	"00:00:08,000 --> 00:00:12,000",
	"from the very first sketch all the way through to the finished piece",
	"",
	"4",
	"00:00:12,000 --> 00:00:15,000",
	"that you are watching right now so let's get started.",
	"",
].join("\n");

const LONG_SAMPLE_SRT_TEXT =
	"Welcome back to the channel everyone today we are going to walk through a really detailed breakdown of how this entire project actually came together from the very first sketch all the way through to the finished piece that you are watching right now so let's get started.";

// A music-only video's real-world caption track: nothing but non-speech
// markers, no actual dialogue.
const MUSIC_ONLY_SRT = [
	"1",
	"00:00:00,000 --> 00:00:03,000",
	"[Music]",
	"",
	"2",
	"00:00:03,000 --> 00:00:06,000",
	"[Music playing]",
	"",
].join("\n");

describe("parseSrtToPlainText", () => {
	it("drops index numbers and timestamp lines, strips tags, and joins cue text", async () => {
		const { parseSrtToPlainText } = await importFresh();
		expect(parseSrtToPlainText(SAMPLE_SRT)).toBe("Hello and welcome to this video.");
	});

	it("joins a multi-line cue's text lines with a space", async () => {
		const { parseSrtToPlainText } = await importFresh();
		const srt = "1\n00:00:00,000 --> 00:00:02,000\nLine one\nLine two\n";
		expect(parseSrtToPlainText(srt)).toBe("Line one Line two");
	});

	it("returns an empty string for a file with no cue text", async () => {
		const { parseSrtToPlainText } = await importFresh();
		expect(parseSrtToPlainText("")).toBe("");
	});

	it("strips non-speech markers like [Music] and (applause)", async () => {
		const { parseSrtToPlainText } = await importFresh();
		expect(parseSrtToPlainText(MUSIC_ONLY_SRT)).toBe("");

		const mixed = "1\n00:00:00,000 --> 00:00:02,000\nGreat shot [Music] right there\n";
		expect(parseSrtToPlainText(mixed)).toBe("Great shot right there");

		const parens = "1\n00:00:00,000 --> 00:00:02,000\n(applause continues) thank you all\n";
		expect(parseSrtToPlainText(parens)).toBe("thank you all");
	});
});

describe("getVideoTranscript", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
		mockGetAccessToken.mockReset();
	});

	it("throws when YOUTUBE_API_BASE_URL is missing", async () => {
		delete process.env.YOUTUBE_API_BASE_URL;
		const { getVideoTranscript } = await importFresh();

		await expect(getVideoTranscript("abc")).rejects.toThrow("Missing YOUTUBE_API_BASE_URL");
	});

	it("returns undefined when the video has no caption tracks", async () => {
		setEnv();
		mockGetAccessToken.mockResolvedValue("access-token");
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [] }) }));

		const { getVideoTranscript } = await importFresh();
		expect(await getVideoTranscript("abc")).toBeUndefined();
	});

	it("prefers a non-ASR track and downloads/parses it", async () => {
		setEnv();
		mockGetAccessToken.mockResolvedValue("access-token");

		const mockFetch = vi.fn();
		mockFetch.mockImplementation((url: string) => {
			if (String(url).includes("/captions?")) {
				return Promise.resolve({
					ok: true,
					json: async () => ({
						items: [
							{ id: "asr-track", snippet: { language: "en", trackKind: "ASR" } },
							{ id: "human-track", snippet: { language: "en", trackKind: "standard" } },
						],
					}),
				});
			}
			return Promise.resolve({ ok: true, text: async () => LONG_SAMPLE_SRT });
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getVideoTranscript } = await importFresh();
		const transcript = await getVideoTranscript("abc");

		expect(transcript).toBe(LONG_SAMPLE_SRT_TEXT);

		const downloadCall = mockFetch.mock.calls.find(([url]) => String(url).includes("/captions/"));
		expect(String(downloadCall?.[0])).toContain("/captions/human-track?tfmt=srt");
		expect((downloadCall?.[1] as RequestInit).headers).toEqual({ Authorization: "Bearer access-token" });
	});

	it("falls back to an ASR track when no standard track exists", async () => {
		setEnv();
		mockGetAccessToken.mockResolvedValue("access-token");

		const mockFetch = vi.fn().mockImplementation((url: string) => {
			if (String(url).includes("/captions?")) {
				return Promise.resolve({
					ok: true,
					json: async () => ({ items: [{ id: "asr-track", snippet: { language: "en", trackKind: "ASR" } }] }),
				});
			}
			return Promise.resolve({ ok: true, text: async () => LONG_SAMPLE_SRT });
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getVideoTranscript } = await importFresh();
		expect(await getVideoTranscript("abc")).toBe(LONG_SAMPLE_SRT_TEXT);
	});

	it("returns undefined for a transcript under the minimum word count (e.g. a short greeting)", async () => {
		setEnv();
		mockGetAccessToken.mockResolvedValue("access-token");

		const mockFetch = vi.fn().mockImplementation((url: string) => {
			if (String(url).includes("/captions?")) {
				return Promise.resolve({
					ok: true,
					json: async () => ({ items: [{ id: "human-track", snippet: { language: "en", trackKind: "standard" } }] }),
				});
			}
			return Promise.resolve({ ok: true, text: async () => SAMPLE_SRT });
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getVideoTranscript } = await importFresh();
		expect(await getVideoTranscript("abc")).toBeUndefined();
	});

	it("returns undefined for a music-only video (transcript is entirely non-speech markers)", async () => {
		setEnv();
		mockGetAccessToken.mockResolvedValue("access-token");

		const mockFetch = vi.fn().mockImplementation((url: string) => {
			if (String(url).includes("/captions?")) {
				return Promise.resolve({
					ok: true,
					json: async () => ({ items: [{ id: "asr-track", snippet: { language: "en", trackKind: "ASR" } }] }),
				});
			}
			return Promise.resolve({ ok: true, text: async () => MUSIC_ONLY_SRT });
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getVideoTranscript } = await importFresh();
		expect(await getVideoTranscript("abc")).toBeUndefined();
	});

	it("throws when captions.list fails", async () => {
		setEnv();
		mockGetAccessToken.mockResolvedValue("access-token");
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403, text: async () => "forbidden" }));

		const { getVideoTranscript } = await importFresh();
		await expect(getVideoTranscript("abc")).rejects.toThrow(/403/);
	});
});
