import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import PostTaxonomies from "@/app/posts/[slug]/fragments/PostTaxonomies";

describe("PostTaxonomies", () => {
	it("renders categories and tags as links to the filtered archive", () => {
		render(
			<PostTaxonomies
				categories={{ nodes: [{ name: "Uncategorized", slug: "uncategorized" }] }}
				tags={{
					nodes: [
						{ name: "AI", slug: "ai" },
						{ name: "AI-Collections", slug: "ai-collections" },
					],
				}}
			/>,
		);

		expect(screen.getByRole("link", { name: "Uncategorized" })).toHaveAttribute(
			"href",
			"/posts?category=uncategorized",
		);
		expect(screen.getByRole("link", { name: "AI" })).toHaveAttribute("href", "/posts?tag=ai");
		expect(screen.getByRole("link", { name: "AI-Collections" })).toHaveAttribute(
			"href",
			"/posts?tag=ai-collections",
		);
	});

	it("separates multiple category links with a comma", () => {
		const { container } = render(
			<PostTaxonomies
				categories={{ nodes: [{ name: "News", slug: "news" }, { name: "Updates", slug: "updates" }] }}
				tags={null}
			/>,
		);

		expect(screen.getByRole("link", { name: "News" })).toHaveAttribute("href", "/posts?category=news");
		expect(screen.getByRole("link", { name: "Updates" })).toHaveAttribute("href", "/posts?category=updates");
		expect(container.textContent).toBe("News, Updates");
	});

	it("renders tags only when the post has no categories", () => {
		render(
			<PostTaxonomies
				categories={null}
				tags={{ nodes: [{ name: "AI", slug: "ai" }] }}
			/>,
		);

		expect(screen.getByRole("link", { name: "AI" })).toBeInTheDocument();
	});

	it("renders nothing when the post has neither categories nor tags", () => {
		const { container } = render(<PostTaxonomies categories={null} tags={null} />);

		expect(container).toBeEmptyDOMElement();
	});
});
