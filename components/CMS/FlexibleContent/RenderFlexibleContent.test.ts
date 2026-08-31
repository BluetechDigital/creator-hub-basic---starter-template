import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetLocale = vi.fn();
const mockGetTranslatedContent = vi.fn();

vi.mock("@/i18n/getLocale", () => ({
	getLocale: () => mockGetLocale(),
}));

vi.mock("@/api/Translation/GetTranslatedContent", () => ({
	getTranslatedContent: (...args: unknown[]) => mockGetTranslatedContent(...args),
}));

import { PROSE_FIELDS, translateBlockProse, DynamicComponentLoaders } from "@/components/CMS/FlexibleContent/RenderFlexibleContent";

describe("PROSE_FIELDS", () => {
	it("only allowlists fields on blocks that are actually registered in DynamicComponentLoaders", () => {
		// Guards against a typo'd/renamed block key silently making a whole
		// block's prose translation a permanent no-op — the same class of
		// drift blockRegistration.test.ts guards for DynamicComponentLoaders
		// itself, applied to this allowlist instead.
		for (const simpleName of Object.keys(PROSE_FIELDS)) {
			expect(DynamicComponentLoaders).toHaveProperty(simpleName);
		}
	});
});

describe("translateBlockProse", () => {
	beforeEach(() => {
		mockGetLocale.mockReset();
		mockGetTranslatedContent.mockReset();
	});

	it("returns {} when the block has no PROSE_FIELDS entry", async () => {
		mockGetLocale.mockResolvedValue("fr");

		const result = await translateBlockProse({ title: "Hello" }, undefined);

		expect(result).toEqual({});
		expect(mockGetTranslatedContent).not.toHaveBeenCalled();
	});

	it("returns {} when none of the allowlisted keys are present as non-empty strings", async () => {
		mockGetLocale.mockResolvedValue("fr");

		const result = await translateBlockProse(
			{ title: undefined, otherField: "some non-prose ACF value" },
			{ plain: ["title"] },
		);

		expect(result).toEqual({});
		expect(mockGetTranslatedContent).not.toHaveBeenCalled();
	});

	it("translates only the allowlisted plain field, leaving every other ACF field alone", async () => {
		mockGetLocale.mockResolvedValue("fr");
		mockGetTranslatedContent.mockResolvedValue(["Nos Blogs"]);

		const result = await translateBlockProse(
			{ title: "Our Blogs", backgroundColor: "#ffffff", displaySection: true },
			{ plain: ["title"] },
		);

		expect(result).toEqual({ title: "Nos Blogs" });
		expect(mockGetTranslatedContent).toHaveBeenCalledWith(["Our Blogs"], "fr", false);
	});

	it("translates a paragraph field via Azure's HTML mode, not plain mode", async () => {
		mockGetLocale.mockResolvedValue("de");
		mockGetTranslatedContent
			.mockResolvedValueOnce(["Titel"]) // plain: title
			.mockResolvedValueOnce(["<p>Absatz</p>"]); // html: paragraph

		const result = await translateBlockProse(
			{ title: "Title", paragraph: "<p>Paragraph</p>", displayParagraph: true },
			{ plain: ["title"], html: ["paragraph"] },
		);

		expect(result).toEqual({ title: "Titel", paragraph: "<p>Absatz</p>" });
		expect(mockGetTranslatedContent).toHaveBeenNthCalledWith(1, ["Title"], "de", false);
		expect(mockGetTranslatedContent).toHaveBeenNthCalledWith(2, ["<p>Paragraph</p>"], "de", true);
	});

	it("is a no-op for the default locale ('en') — never calls Azure", async () => {
		mockGetLocale.mockResolvedValue("en");

		const result = await translateBlockProse({ title: "Hello" }, { plain: ["title"] });

		expect(result).toEqual({ title: "Hello" });
		expect(mockGetTranslatedContent).not.toHaveBeenCalled();
	});
});
