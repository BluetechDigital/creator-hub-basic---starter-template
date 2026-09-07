import { describe, it, expect } from "vitest";
import { sanitizeCommentHtml } from "./sanitizeCommentHtml";

describe("sanitizeCommentHtml", () => {
	it("keeps the allowed inline / list / block tags", () => {
		const html = "<p>Hello <strong>world</strong> and <em>friends</em></p><ul><li>one</li></ul>";
		expect(sanitizeCommentHtml(html)).toBe(html);
	});

	it("strips <script> entirely", () => {
		expect(sanitizeCommentHtml('<p>hi</p><script>alert(1)</script>')).toBe("<p>hi</p>");
	});

	it("strips an event-handler attribute", () => {
		expect(sanitizeCommentHtml('<p onclick="steal()">hi</p>')).toBe("<p>hi</p>");
	});

	it("drops links to their text (no <a> in comments)", () => {
		expect(sanitizeCommentHtml('<p>see <a href="https://evil.example">this</a></p>')).toBe("<p>see this</p>");
	});

	it("strips <iframe>, <img>, <style> and <form>", () => {
		const html =
			'<p>x</p><iframe src="https://evil.example"></iframe><img src="x" onerror="y()"><style>*{}</style><form action="https://evil.example"></form>';
		expect(sanitizeCommentHtml(html)).toBe("<p>x</p>");
	});

	it("removes class / id / style attributes from allowed tags", () => {
		expect(sanitizeCommentHtml('<blockquote class="x" id="y" style="color:red">q</blockquote>')).toBe(
			"<blockquote>q</blockquote>",
		);
	});

	it("returns an empty string for null / undefined / empty input", () => {
		expect(sanitizeCommentHtml(null)).toBe("");
		expect(sanitizeCommentHtml(undefined)).toBe("");
		expect(sanitizeCommentHtml("")).toBe("");
	});
});
