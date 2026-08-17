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
});
