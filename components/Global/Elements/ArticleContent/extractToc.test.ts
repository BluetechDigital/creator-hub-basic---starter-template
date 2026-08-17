import { describe, it, expect } from "vitest";

import { extractToc } from "@/components/Global/Elements/ArticleContent/extractToc";

describe("extractToc", () => {
	it("extracts h2/h3 headings in document order with their level", () => {
		const { headings } = extractToc(
			"<p>Intro</p><h2>Why this matters</h2><p>...</p><h3>A sub point</h3><h2>Results</h2>",
		);

		expect(headings).toEqual([
			{ id: "why-this-matters", text: "Why this matters", level: 2 },
			{ id: "a-sub-point", text: "A sub point", level: 3 },
			{ id: "results", text: "Results", level: 2 },
		]);
	});

	it("injects matching ids into the returned content for every extracted heading", () => {
		const { headings, contentWithAnchors } = extractToc("<h2>Why this matters</h2><p>Body</p>");

		expect(contentWithAnchors).toContain(`<h2 id="${headings[0].id}">Why this matters</h2>`);
	});

	it("de-duplicates colliding slugs with a numeric suffix in encounter order", () => {
		const { headings } = extractToc("<h2>Overview</h2><h2>Overview</h2><h2>Overview</h2>");

		expect(headings.map((h) => h.id)).toEqual(["overview", "overview-2", "overview-3"]);
	});

	it("strips nested tags from heading text but keeps the plain text label", () => {
		const { headings } = extractToc("<h2>Why <em>this</em> matters</h2>");

		expect(headings[0].text).toBe("Why this matters");
	});

	it("returns an empty headings array for content with no headings", () => {
		const { headings, contentWithAnchors } = extractToc("<p>Just a paragraph.</p>");

		expect(headings).toEqual([]);
		expect(contentWithAnchors).toBe("<p>Just a paragraph.</p>");
	});

	it("sanitizes the content before extracting/injecting anchors", () => {
		const { headings, contentWithAnchors } = extractToc('<h2>Title<script>alert(1)</script></h2>');

		expect(contentWithAnchors).not.toContain("<script>");
		expect(headings[0].text).toBe("Title");
	});
});
