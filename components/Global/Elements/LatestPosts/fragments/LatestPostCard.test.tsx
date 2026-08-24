import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import LatestPostCard from "@/components/Global/Elements/LatestPosts/fragments/LatestPostCard";
import type { ISummaryProps } from "@/graphql/CMS/types/post";

const post: ISummaryProps = {
	title: "Another Post",
	slug: "another-post",
	date: "2026-01-05T00:00:00",
	excerpt: "<p>A quick summary.</p>",
	featuredImage: { node: { sourceUrl: "https://example.test/latest.jpg", altText: "Latest" } },
	categories: { nodes: [{ name: "News", slug: "news" }] },
	tags: { nodes: [{ name: "AI", slug: "ai" }, { name: "AI-Collections", slug: "ai-collections" }] },
	seo: { readingTime: 4 },
};

describe("LatestPosts LatestPostCard", () => {
	it("renders the title, image, excerpt, and read time", () => {
		render(<LatestPostCard post={post} />);

		expect(screen.getByText("Another Post")).toBeInTheDocument();
		expect(screen.getByText("A quick summary.")).toBeInTheDocument();
		expect(screen.getByText("4 min read")).toBeInTheDocument();

		const link = screen.getByRole("link", { name: "Another Post" });
		expect(link).toHaveAttribute("href", "/posts/another-post");

		const image = screen.getByAltText("Latest");
		expect(decodeURIComponent(image.getAttribute("src") ?? "")).toContain("https://example.test/latest.jpg");
	});

	it("renders tag pills (linking to the archive's tag filter) instead of the category when the post has tags", () => {
		render(<LatestPostCard post={post} />);

		expect(screen.getByRole("link", { name: "AI" })).toHaveAttribute("href", "/posts?tag=ai");
		expect(screen.getByRole("link", { name: "AI-Collections" })).toHaveAttribute("href", "/posts?tag=ai-collections");
		expect(screen.queryByText("News")).not.toBeInTheDocument();
	});

	it("falls back to the category pill (linking to the archive's category filter) when the post has no tags", () => {
		const postWithoutTags: ISummaryProps = { ...post, tags: null };

		render(<LatestPostCard post={postWithoutTags} />);

		expect(screen.getByRole("link", { name: "News" })).toHaveAttribute("href", "/posts?category=news");
	});

	it("falls back to the category pill when the post has an empty tags list", () => {
		const postWithEmptyTags: ISummaryProps = { ...post, tags: { nodes: [] } };

		render(<LatestPostCard post={postWithEmptyTags} />);

		expect(screen.getByRole("link", { name: "News" })).toHaveAttribute("href", "/posts?category=news");
	});

	it("renders no pill row when the post has neither tags nor categories", () => {
		const postWithNeither: ISummaryProps = { ...post, tags: null, categories: null };

		render(<LatestPostCard post={postWithNeither} />);

		expect(screen.queryByText("News")).not.toBeInTheDocument();
		expect(screen.queryByText("AI")).not.toBeInTheDocument();
	});

	it("does not render an image or read-time separator when missing", () => {
		const postWithoutExtras: ISummaryProps = { ...post, featuredImage: null, seo: null };

		render(<LatestPostCard post={postWithoutExtras} />);

		expect(screen.queryByRole("img")).not.toBeInTheDocument();
		expect(screen.queryByText(/min read/)).not.toBeInTheDocument();
	});
});
