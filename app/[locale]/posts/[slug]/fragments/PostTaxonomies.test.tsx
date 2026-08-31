import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/i18n/getLocale", () => ({
	getLocale: () => Promise.resolve("en"),
}));

import PostTaxonomies from "@/app/[locale]/posts/[slug]/fragments/PostTaxonomies";

// PostTaxonomies is an async Server Component — RTL's render() can't take a
// Promise directly, so each test calls it as a plain async function and
// awaits the resolved element first, same pattern any async Server Component
// test in this codebase needs.
describe("PostTaxonomies", () => {
	it("renders categories and tags as links to the locale-prefixed filtered archive", async () => {
		render(
			await PostTaxonomies({
				categories: { nodes: [{ name: "Uncategorized", slug: "uncategorized" }] },
				tags: {
					nodes: [
						{ name: "AI", slug: "ai" },
						{ name: "AI-Collections", slug: "ai-collections" },
					],
				},
			}),
		);

		expect(screen.getByRole("link", { name: "Uncategorized" })).toHaveAttribute(
			"href",
			"/en/posts?category=uncategorized",
		);
		expect(screen.getByRole("link", { name: "AI" })).toHaveAttribute("href", "/en/posts?tag=ai");
		expect(screen.getByRole("link", { name: "AI-Collections" })).toHaveAttribute(
			"href",
			"/en/posts?tag=ai-collections",
		);
	});

	it("separates multiple category links with a comma", async () => {
		const { container } = render(
			await PostTaxonomies({
				categories: { nodes: [{ name: "News", slug: "news" }, { name: "Updates", slug: "updates" }] },
				tags: null,
			}),
		);

		expect(screen.getByRole("link", { name: "News" })).toHaveAttribute("href", "/en/posts?category=news");
		expect(screen.getByRole("link", { name: "Updates" })).toHaveAttribute("href", "/en/posts?category=updates");
		expect(container.textContent).toBe("News, Updates");
	});

	it("renders tags only when the post has no categories", async () => {
		render(
			await PostTaxonomies({
				categories: null,
				tags: { nodes: [{ name: "AI", slug: "ai" }] },
			}),
		);

		expect(screen.getByRole("link", { name: "AI" })).toBeInTheDocument();
	});

	it("renders nothing when the post has neither categories nor tags", async () => {
		const element = await PostTaxonomies({ categories: null, tags: null });

		expect(element).toBeNull();
	});
});
