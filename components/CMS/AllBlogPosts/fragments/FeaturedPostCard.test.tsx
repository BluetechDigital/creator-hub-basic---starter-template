import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
	useParams: () => ({ locale: "en" }),
}));

import FeaturedPostCard from "@/components/CMS/AllBlogPosts/fragments/FeaturedPostCard";
import type { ISummaryProps } from "@/graphql/CMS/types/post";

const post: ISummaryProps = {
	title: "Featured Post",
	slug: "featured-post",
	date: "2026-01-01T00:00:00",
	excerpt: "<p>Excerpt</p>",
	featuredImage: { node: { sourceUrl: "https://example.test/hero.jpg", altText: "Hero" } },
};

describe("AllBlogPosts FeaturedPostCard", () => {
	it("renders the title, date, image, and a link to the post", () => {
		render(<FeaturedPostCard post={post} />);

		expect(screen.getByText("Featured Post")).toBeInTheDocument();
		expect(screen.getByRole("link")).toHaveAttribute("href", "/en/posts/featured-post");

		const image = screen.getByAltText("Hero");
		expect(decodeURIComponent(image.getAttribute("src") ?? "")).toContain("https://example.test/hero.jpg");
	});

	it("renders nothing when the post has no featured image", () => {
		const postWithoutImage: ISummaryProps = { ...post, featuredImage: null };

		const { container } = render(<FeaturedPostCard post={postWithoutImage} />);

		expect(container).toBeEmptyDOMElement();
	});
});
