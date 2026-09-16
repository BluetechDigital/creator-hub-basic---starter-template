/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { NextResponse } from "next/server";
import { getAllYoutubeVideos } from "@/api/YouTube/GetAllYoutubeContent";
import { getVideoTranscript } from "@/api/YouTube/GetVideoCaptions";
import { generateArticleFromTranscript } from "@/api/Anthropic/GenerateVideoArticle";
import { videoArticleExists, createVideoArticleDraft } from "@/api/WordPress/CreateVideoArticleDraft";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Video-to-article generation cron XXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export const dynamic = "force-dynamic";

const DEFAULT_MAX_PER_RUN = 5;

/**
 * Weekly cron (see `vercel.json`) that turns the channel's most recent
 * uploads into WordPress draft articles: for each of the
 * `VIDEO_ARTICLE_MAX_PER_RUN` newest videos, skip it if an article already
 * exists (`videoArticleExists`, checked by a deterministic slug — see
 * `buildVideoArticleSlug`), otherwise fetch its caption transcript
 * (`getVideoTranscript`), rewrite it into an article (`generateArticleFromTranscript`),
 * and create it as a WordPress draft (`createVideoArticleDraft`) for the
 * creator to review and publish themselves — nothing here ever auto-publishes.
 *
 * Each video is processed inside its own try/catch so one failure (a video
 * with no captions, a malformed model response, a transient API error)
 * only costs that video, not the rest of the run — same resilience pattern as
 * `getPlaylistVideoIds`'s full-catalog walk.
 *
 * Vercel automatically sends `Authorization: Bearer $CRON_SECRET` on scheduled
 * invocations — the same secret `/api/instagram/refresh-token` already
 * requires, reused here rather than minting a second one. Any request without
 * that exact header is rejected.
 */
export const GET = async (request: Request): Promise<Response> => {
	const secret = process.env.CRON_SECRET;
	if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const maxPerRun = Number(process.env.VIDEO_ARTICLE_MAX_PER_RUN ?? DEFAULT_MAX_PER_RUN);

	let videos;
	try {
		videos = await getAllYoutubeVideos();
	} catch (error) {
		console.error("[generate-articles] Failed to fetch the channel's videos:", error);
		return NextResponse.json({ ok: false, error: "Failed to fetch the channel's videos." }, { status: 502 });
	}

	const candidates = videos.slice(0, maxPerRun);

	let created = 0;
	let skipped = 0;
	let failed = 0;

	for (const video of candidates) {
		try {
			if (await videoArticleExists(video.videoId)) {
				skipped++;
				continue;
			}

			const transcript = await getVideoTranscript(video.videoId);
			if (!transcript) {
				skipped++;
				continue;
			}

			const article = await generateArticleFromTranscript(transcript, video.snippet.title);
			if (!article) {
				failed++;
				continue;
			}

			await createVideoArticleDraft({
				videoId: video.videoId,
				title: article.title,
				contentHtml: article.contentHtml,
			});
			created++;

		} catch (error) {
			console.error(`[generate-articles] Failed processing video ${video.videoId}:`, error);
			failed++;
		}
	}

	// Transcript/article text is never included here — same "no content
	// payloads in the cron response" precedent as the Instagram refresh route
	// never returning the token itself.
	return NextResponse.json({ ok: true, processed: candidates.length, created, skipped, failed });
};
