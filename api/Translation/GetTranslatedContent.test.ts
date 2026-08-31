import { describe, it, expect, afterEach, vi } from "vitest";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Why the dynamic import XXXXXXXXXXXXXXXXXXXXXXXXXX
AZURE_TRANSLATOR_KEY/AZURE_TRANSLATOR_REGION/AZURE_TRANSLATOR_ENDPOINT are read into
module-scope consts on import (GetTranslatedContent.ts:5-7), not re-read per call. To
test both the "missing env var" and "present env var" paths in the same file, each
test has to set process.env *before* importing a fresh copy of the module —
vi.resetModules() clears vitest's module cache so the next import() re-runs that
module-scope env read.
----------------------------------------------------------------------------- */

const originalEnv = { ...process.env };

const importFreshModule = async () => {
	vi.resetModules();
	return import("./GetTranslatedContent");
};

const setAzureEnv = () => {
	process.env.AZURE_TRANSLATOR_KEY = "test-key";
	process.env.AZURE_TRANSLATOR_REGION = "test-region";
	process.env.AZURE_TRANSLATOR_ENDPOINT = "https://example.test/translator";
};

describe("getTranslatedContent", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("throws when required env vars are missing", async () => {
		delete process.env.AZURE_TRANSLATOR_KEY;
		delete process.env.AZURE_TRANSLATOR_REGION;
		delete process.env.AZURE_TRANSLATOR_ENDPOINT;

		const { getTranslatedContent } = await importFreshModule();

		await expect(getTranslatedContent(["Hello"], "fr")).rejects.toThrow(
			"Missing Azure Translator environment variables",
		);
	});

	it("returns an empty array without calling fetch when texts is empty", async () => {
		setAzureEnv();
		const mockFetch = vi.fn();
		vi.stubGlobal("fetch", mockFetch);

		const { getTranslatedContent } = await importFreshModule();

		expect(await getTranslatedContent([], "fr")).toEqual([]);
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it("posts a batched request with the right URL, headers, and body, and returns translations in order", async () => {
		setAzureEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ([
				{ translations: [{ text: "Bonjour", to: "fr" }] },
				{ translations: [{ text: "Au revoir", to: "fr" }] },
			]),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getTranslatedContent } = await importFreshModule();

		const result = await getTranslatedContent(["Hello", "Goodbye"], "fr");

		expect(result).toEqual(["Bonjour", "Au revoir"]);

		const [url, init] = mockFetch.mock.calls[0];
		expect(url).toContain("to=fr");
		expect(url).toContain("textType=plain");
		expect(init.method).toBe("POST");
		expect(init.headers["Ocp-Apim-Subscription-Key"]).toBe("test-key");
		expect(init.headers["Ocp-Apim-Subscription-Region"]).toBe("test-region");
		expect(JSON.parse(init.body)).toEqual([{ Text: "Hello" }, { Text: "Goodbye" }]);
	});

	it("selects textType=html when isHtml is true", async () => {
		setAzureEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ([{ translations: [{ text: "<p>Bonjour</p>", to: "fr" }] }]),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getTranslatedContent } = await importFreshModule();

		await getTranslatedContent(["<p>Hello</p>"], "fr", true);

		const [url] = mockFetch.mock.calls[0];
		expect(url).toContain("textType=html");
	});

	it("throws a generic wrapped error when the response is not ok", async () => {
		setAzureEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 401,
			json: async () => ({ error: { message: "Access denied" } }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getTranslatedContent } = await importFreshModule();

		await expect(getTranslatedContent(["Hello"], "fr")).rejects.toThrow(
			"Failed to translate content",
		);
	});
});
