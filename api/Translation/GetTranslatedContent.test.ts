import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

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
			headers: new Headers(),
			json: async () => ({ error: { message: "Access denied" } }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { getTranslatedContent } = await importFreshModule();

		await expect(getTranslatedContent(["Hello"], "fr")).rejects.toThrow(
			"Failed to translate content",
		);
		expect(mockFetch).toHaveBeenCalledTimes(1); // 401 isn't retryable — no retry attempted
	});

	describe("retrying a transient 429/503", () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("retries a 429 with backoff and succeeds once Azure recovers", async () => {
			setAzureEnv();

			const throttled = { ok: false, status: 429, headers: new Headers(), json: async () => ({}) };
			const succeeded = {
				ok: true,
				json: async () => ([{ translations: [{ text: "Bonjour", to: "fr" }] }]),
			};
			const mockFetch = vi.fn()
				.mockResolvedValueOnce(throttled)
				.mockResolvedValueOnce(succeeded);
			vi.stubGlobal("fetch", mockFetch);

			const { getTranslatedContent } = await importFreshModule();

			const resultPromise = getTranslatedContent(["Hello"], "fr");
			await vi.advanceTimersByTimeAsync(1000); // first backoff: 2^0 * 1000ms

			expect(await resultPromise).toEqual(["Bonjour"]);
			expect(mockFetch).toHaveBeenCalledTimes(2);
		});

		it("honours the Retry-After header instead of the default backoff", async () => {
			setAzureEnv();

			const throttled = {
				ok: false,
				status: 429,
				headers: new Headers({ "retry-after": "3" }),
				json: async () => ({}),
			};
			const succeeded = { ok: true, json: async () => ([{ translations: [{ text: "Bonjour", to: "fr" }] }]) };
			const mockFetch = vi.fn()
				.mockResolvedValueOnce(throttled)
				.mockResolvedValueOnce(succeeded);
			vi.stubGlobal("fetch", mockFetch);

			const { getTranslatedContent } = await importFreshModule();

			const resultPromise = getTranslatedContent(["Hello"], "fr");

			await vi.advanceTimersByTimeAsync(1000); // less than the 3s Retry-After — not retried yet
			expect(mockFetch).toHaveBeenCalledTimes(1);

			await vi.advanceTimersByTimeAsync(2000); // now past the full 3s
			expect(await resultPromise).toEqual(["Bonjour"]);
			expect(mockFetch).toHaveBeenCalledTimes(2);
		});

		it("gives up after MAX_RETRIES and throws", async () => {
			setAzureEnv();

			const throttled = { ok: false, status: 503, headers: new Headers(), json: async () => ({}) };
			const mockFetch = vi.fn().mockResolvedValue(throttled);
			vi.stubGlobal("fetch", mockFetch);

			const { getTranslatedContent } = await importFreshModule();

			const resultPromise = getTranslatedContent(["Hello"], "fr");
			resultPromise.catch(() => {}); // avoid an unhandled-rejection warning while timers advance

			await vi.advanceTimersByTimeAsync(20_000); // well past every backoff (1s + 2s + 4s)

			await expect(resultPromise).rejects.toThrow("Failed to translate content");
			expect(mockFetch).toHaveBeenCalledTimes(4); // the initial attempt + 3 retries
		});
	});
});
