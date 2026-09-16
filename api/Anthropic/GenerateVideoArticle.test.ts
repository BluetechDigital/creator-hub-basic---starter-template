import { describe, it, expect, afterEach, vi } from "vitest";

const originalEnv = { ...process.env };

const importFresh = async () => {
	vi.resetModules();
	return import("./GenerateVideoArticle");
};

describe("parseGeneratedArticle", () => {
	it("parses a plain JSON response", async () => {
		const { parseGeneratedArticle } = await importFresh();
		const result = parseGeneratedArticle('{"title": "A Great Title", "contentHtml": "<p>Body</p>"}');
		expect(result).toEqual({ title: "A Great Title", contentHtml: "<p>Body</p>" });
	});

	it("strips a markdown code fence around the JSON", async () => {
		const { parseGeneratedArticle } = await importFresh();
		const text = '```json\n{"title": "A Great Title", "contentHtml": "<p>Body</p>"}\n```';
		expect(parseGeneratedArticle(text)).toEqual({ title: "A Great Title", contentHtml: "<p>Body</p>" });
	});

	it("returns undefined for undefined input", async () => {
		const { parseGeneratedArticle } = await importFresh();
		expect(parseGeneratedArticle(undefined)).toBeUndefined();
	});

	it("returns undefined for malformed JSON", async () => {
		const { parseGeneratedArticle } = await importFresh();
		expect(parseGeneratedArticle("not json at all")).toBeUndefined();
	});

	it("returns undefined when title is missing", async () => {
		const { parseGeneratedArticle } = await importFresh();
		expect(parseGeneratedArticle('{"contentHtml": "<p>Body</p>"}')).toBeUndefined();
	});

	it("returns undefined when contentHtml is an empty string", async () => {
		const { parseGeneratedArticle } = await importFresh();
		expect(parseGeneratedArticle('{"title": "Title", "contentHtml": "   "}')).toBeUndefined();
	});
});

describe("generateArticleFromTranscript", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("throws when ANTHROPIC_API_KEY is missing", async () => {
		delete process.env.ANTHROPIC_API_KEY;
		const { generateArticleFromTranscript } = await importFresh();

		await expect(generateArticleFromTranscript("transcript", "Video Title")).rejects.toThrow(
			"Missing ANTHROPIC_API_KEY",
		);
	});

	it("sends the transcript/title in the prompt and parses the response", async () => {
		process.env.ANTHROPIC_API_KEY = "sk-ant-test";

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				content: [{ type: "text", text: '{"title": "Rewritten Title", "contentHtml": "<p>Body</p>"}' }],
			}),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { generateArticleFromTranscript } = await importFresh();
		const result = await generateArticleFromTranscript("full transcript text", "Original Video Title");

		expect(result).toEqual({ title: "Rewritten Title", contentHtml: "<p>Body</p>" });

		const [url, init] = mockFetch.mock.calls[0];
		expect(String(url)).toBe("https://api.anthropic.com/v1/messages");
		expect((init as RequestInit).headers).toMatchObject({ "x-api-key": "sk-ant-test" });

		const body = JSON.parse((init as RequestInit).body as string);
		expect(body.messages[0].content).toContain("full transcript text");
		expect(body.messages[0].content).toContain("Original Video Title");
	});

	it("throws when the Anthropic API responds non-OK", async () => {
		process.env.ANTHROPIC_API_KEY = "sk-ant-test";
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({ ok: false, status: 529, text: async () => "overloaded" }),
		);

		const { generateArticleFromTranscript } = await importFresh();
		await expect(generateArticleFromTranscript("transcript", "Title")).rejects.toThrow(/529/);
	});

	it("returns undefined when the model's response has no text block", async () => {
		process.env.ANTHROPIC_API_KEY = "sk-ant-test";
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ content: [] }) }));

		const { generateArticleFromTranscript } = await importFresh();
		expect(await generateArticleFromTranscript("transcript", "Title")).toBeUndefined();
	});
});
