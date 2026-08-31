import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetLocale = vi.fn();
const mockGetTranslatedContent = vi.fn();

vi.mock("@/i18n/getLocale", () => ({
	getLocale: () => mockGetLocale(),
}));

vi.mock("@/api/Translation/GetTranslatedContent", () => ({
	getTranslatedContent: (...args: unknown[]) => mockGetTranslatedContent(...args),
}));

import { translateFields, translatePostSummaries } from "@/i18n/translateContent";

describe("translateFields", () => {
	beforeEach(() => {
		mockGetLocale.mockReset();
		mockGetTranslatedContent.mockReset();
	});

	it("is a no-op for the default locale ('en') — never calls Azure", async () => {
		mockGetLocale.mockResolvedValue("en");

		const fields = { title: "Hello", excerpt: "World" };
		const result = await translateFields(fields);

		expect(result).toBe(fields); // same reference, not just equal
		expect(mockGetTranslatedContent).not.toHaveBeenCalled();
	});

	it("translates plain-text fields for a non-default locale", async () => {
		mockGetLocale.mockResolvedValue("fr");
		mockGetTranslatedContent.mockResolvedValue(["Bonjour", "Monde"]);

		const result = await translateFields({ title: "Hello", excerpt: "World" });

		expect(result).toEqual({ title: "Bonjour", excerpt: "Monde" });
		expect(mockGetTranslatedContent).toHaveBeenCalledWith(["Hello", "World"], "fr", false);
	});

	it("splits html-flagged fields into a separate, html-mode call", async () => {
		mockGetLocale.mockResolvedValue("fr");
		mockGetTranslatedContent
			.mockResolvedValueOnce(["Bonjour"]) // plain: title
			.mockResolvedValueOnce(["<p>Le monde</p>"]); // html: content

		const result = await translateFields(
			{ title: "Hello", content: "<p>The world</p>" },
			["content"],
		);

		expect(result).toEqual({ title: "Bonjour", content: "<p>Le monde</p>" });
		expect(mockGetTranslatedContent).toHaveBeenNthCalledWith(1, ["Hello"], "fr", false);
		expect(mockGetTranslatedContent).toHaveBeenNthCalledWith(2, ["<p>The world</p>"], "fr", true);
	});

	it("filters out falsy fields before batching", async () => {
		mockGetLocale.mockResolvedValue("fr");
		mockGetTranslatedContent.mockResolvedValue(["Bonjour"]);

		const result = await translateFields({ title: "Hello", excerpt: "" });

		expect(result).toEqual({ title: "Bonjour", excerpt: "" });
		expect(mockGetTranslatedContent).toHaveBeenCalledWith(["Hello"], "fr", false);
		expect(mockGetTranslatedContent).toHaveBeenCalledTimes(1); // no html call, no call for the empty excerpt
	});
});

describe("translatePostSummaries", () => {
	beforeEach(() => {
		mockGetLocale.mockReset();
		mockGetTranslatedContent.mockReset();
	});

	it("is a no-op for the default locale", async () => {
		mockGetLocale.mockResolvedValue("en");
		const posts = [{ title: "Hello", excerpt: "World", slug: "hello" }];

		expect(await translatePostSummaries(posts)).toBe(posts);
		expect(mockGetTranslatedContent).not.toHaveBeenCalled();
	});

	it("batches every post's title/excerpt into one call each, preserving other fields", async () => {
		mockGetLocale.mockResolvedValue("de");
		mockGetTranslatedContent
			.mockResolvedValueOnce(["Hallo", "Zweiter"]) // titles
			.mockResolvedValueOnce(["Welt", "Zwei"]); // excerpts

		const posts = [
			{ title: "Hello", excerpt: "World", slug: "hello" },
			{ title: "Second", excerpt: "Two", slug: "second" },
		];

		const result = await translatePostSummaries(posts);

		expect(result).toEqual([
			{ title: "Hallo", excerpt: "Welt", slug: "hello" },
			{ title: "Zweiter", excerpt: "Zwei", slug: "second" },
		]);
		expect(mockGetTranslatedContent).toHaveBeenNthCalledWith(1, ["Hello", "Second"], "de", false);
		expect(mockGetTranslatedContent).toHaveBeenNthCalledWith(2, ["World", "Two"], "de", false);
	});
});
