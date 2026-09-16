/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import "server-only";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const ANTHROPIC_API_KEY: string | undefined = process.env.ANTHROPIC_API_KEY;
// Overridable so a cheaper/faster model can be swapped in for this one
// rewrite-only task without a code change — defaults to a current
// general-purpose model.
const ANTHROPIC_MODEL: string = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";
const ANTHROPIC_API_VERSION = "2023-06-01";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Prompt XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Builds the rewrite prompt: turn a raw, unpunctuated-by-paragraph video
 * transcript into a structured, readable article. Explicitly asks for JSON
 * output (`{title, contentHtml}`) rather than free-form text, since the
 * caller (`generateArticleFromTranscript`) needs both a title distinct from
 * the video's own title (skipped straight into `<title>`/`<h1>` duplication
 * otherwise) and an HTML body it can hand directly to
 * `createVideoArticleDraft`'s `content` field — WordPress posts are a single
 * WYSIWYG HTML field, not structured blocks.
 * @param transcript Plain-text transcript from `getVideoTranscript`.
 * @param videoTitle The source video's own YouTube title — given as context only, not to be reused verbatim as the article title.
 */
const buildPrompt = (transcript: string, videoTitle: string): string => `You are rewriting a raw, unedited YouTube video transcript into a well-structured, readable blog article for the video titled "${videoTitle}".

Rules:
- Write in flowing prose, organised into paragraphs (and a few subheadings if the content naturally has distinct sections). Do not just insert line breaks into the transcript.
- Remove filler words, false starts, repeated words, and any spoken caption artifacts (e.g. "[Music]", "um", "uh").
- Do not invent facts, claims, or details that were not in the transcript.
- The article title should describe what the article covers — it does not need to match the video's title exactly.
- Output HTML only for the body: use <p>, <h2>/<h3>, <ul>/<li> where appropriate. No <html>/<body>/<script> tags.
- Respond with ONLY a single JSON object, no other text, no markdown code fence, in exactly this shape:
{"title": "...", "contentHtml": "..."}

Transcript:
"""
${transcript}
"""`;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Response Parsing XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export type IGeneratedArticle = {
	title: string;
	contentHtml: string;
};

/**
 * Parses Claude's response text into `{title, contentHtml}`, defensively:
 * strips a markdown code fence if the model wrapped the JSON in one despite
 * being asked not to, and validates both fields are non-empty strings before
 * accepting the result. Never throws — malformed or missing output is
 * reported as `undefined` so `app/api/videos/generate-articles/route.ts` can
 * skip just that one video and continue the run, rather than a single bad
 * generation failing the whole cron.
 * @param text The model's raw response text, or `undefined` if the API returned no text block.
 */
export const parseGeneratedArticle = (text: string | undefined): IGeneratedArticle | undefined => {
	if (!text) return undefined;

	try {
		const jsonText = text
			.trim()
			.replace(/^```(?:json)?\n?/, "")
			.replace(/```$/, "")
			.trim();

		const parsed = JSON.parse(jsonText) as Partial<IGeneratedArticle>;

		if (
			typeof parsed.title !== "string" || !parsed.title.trim() ||
			typeof parsed.contentHtml !== "string" || !parsed.contentHtml.trim()
		) {
			return undefined;
		}

		return { title: parsed.title.trim(), contentHtml: parsed.contentHtml.trim() };
	} catch {
		return undefined;
	}
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXX Generate Article From Transcript XXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IAnthropicMessagesResponse = {
	content?: { type: string; text?: string }[];
};

/**
 * Rewrites a raw video transcript into a structured article via the Anthropic
 * Messages API. A heuristic paragraph-splitter alone can't deliver the
 * "searchable, translatable blog-style article" this feature promises — this
 * is the one step in the pipeline that turns disorganised spoken text into
 * genuine prose.
 * @param transcript Plain-text transcript from `getVideoTranscript`.
 * @param videoTitle The source video's own YouTube title (context only — see `buildPrompt`).
 * @returns The generated `{title, contentHtml}`, or `undefined` if the model's
 * output couldn't be parsed into that shape — callers should skip the video
 * rather than publish malformed content.
 */
export const generateArticleFromTranscript = async (
	transcript: string,
	videoTitle: string,
): Promise<IGeneratedArticle | undefined> => {
	if (!ANTHROPIC_API_KEY) throw new Error("Missing ANTHROPIC_API_KEY environment variable.");

	const response = await fetch("https://api.anthropic.com/v1/messages", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-api-key": ANTHROPIC_API_KEY,
			"anthropic-version": ANTHROPIC_API_VERSION,
		},
		body: JSON.stringify({
			model: ANTHROPIC_MODEL,
			max_tokens: 4096,
			messages: [{ role: "user", content: buildPrompt(transcript, videoTitle) }],
		}),
	});

	if (!response.ok) {
		throw new Error(`Anthropic API request failed (${response.status}): ${await response.text()}`);
	}

	const data: IAnthropicMessagesResponse = await response.json();
	const text = data.content?.find((block) => block.type === "text")?.text;

	return parseGeneratedArticle(text);
};
