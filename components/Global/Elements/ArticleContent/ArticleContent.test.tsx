import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import ArticleContent from "@/components/Global/Elements/ArticleContent/ArticleContent";

describe("ArticleContent", () => {
	it("renders parsed HTML content", () => {
		render(<ArticleContent content="<p>Hello <strong>world</strong>.</p>" />);

		expect(screen.getByText("Hello", { exact: false })).toBeInTheDocument();
		expect(screen.getByText("world")).toBeInTheDocument();
	});

	it("sanitizes a script/onerror XSS payload before rendering", () => {
		const { container } = render(
			<ArticleContent content={'<img src=x onerror="alert(1)"><script>alert(2)</script><p>Safe text</p>'} />,
		);

		expect(container.querySelector("script")).not.toBeInTheDocument();
		expect(container.querySelector("img")?.getAttribute("onerror")).toBeNull();
		expect(screen.getByText("Safe text")).toBeInTheDocument();
	});

	it("routes an http content image through next/image (optimizer URL + generated srcset)", () => {
		const { container } = render(
			<ArticleContent
				content={'<figure class="wp-block-image"><img src="https://i0.wp.com/example.com/photo.jpg" alt="A photo" width="1024" height="683" /></figure>'}
			/>,
		);

		const img = container.querySelector("img");
		expect(img).toBeTruthy();
		expect(img?.getAttribute("src")).toContain("/_next/image");
		expect(img?.getAttribute("src")).toContain("i0.wp.com");
		expect(img).toHaveAttribute("alt", "A photo");
		expect(img?.getAttribute("srcset")).toBeTruthy();
	});

	it("preserves the CMS's inline crop style on the image", () => {
		const { container } = render(
			<ArticleContent
				content={'<img src="https://i0.wp.com/example.com/photo.jpg" alt="" style="aspect-ratio:1;object-fit:cover" width="800" height="800" />'}
			/>,
		);

		const img = container.querySelector("img");
		// jsdom canonicalises `aspect-ratio: 1` to `1 / 1` — just assert it's set.
		expect(img?.style.aspectRatio).toMatch(/^1(\s*\/\s*1)?$/);
		expect(img?.style.objectFit).toBe("cover");
	});

	it("leaves a non-http image src as a plain img (no next/image)", () => {
		const { container } = render(<ArticleContent content={'<img src="data:image/gif;base64,AAAA" alt="inline" />'} />);

		const img = container.querySelector("img");
		expect(img?.getAttribute("src")).toBe("data:image/gif;base64,AAAA");
	});

	it("drops WordPress's dead lightbox trigger button", () => {
		const { container } = render(
			<ArticleContent
				content={'<figure class="wp-block-image"><img src="https://i0.wp.com/example.com/p.jpg" alt="" width="10" height="10" /><button class="lightbox-trigger"><svg></svg></button></figure>'}
			/>,
		);

		expect(container.querySelector("button.lightbox-trigger")).not.toBeInTheDocument();
		expect(container.querySelector("img")).toBeTruthy();
	});
});
