import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/i18n/getLocale", () => ({
	getLocale: () => Promise.resolve("en"),
}));

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

// LatestPostCard is an async Server Component — RTL's render() can't take a
// Promise directly, so each test calls it as a plain async function and
// awaits the resolved element first.
describe("LatestPosts LatestPostCard", () => {
	it("renders the title, image, excerpt, and read time", async () => {
		render(await LatestPostCard({ post }));

		expect(screen.getByText("Another Post")).toBeInTheDocument();
		expect(screen.getByText("A quick summary.")).toBeInTheDocument();
		expect(screen.getByText("4 min read")).toBeInTheDocument();

		const link = screen.getByRole("link", { name: "Another Post" });
		expect(link).toHaveAttribute("href", "/en/posts/another-post");

		const image = screen.getByAltText("Latest");
		expect(decodeURIComponent(image.getAttribute("src") ?? "")).toContain("https://example.test/latest.jpg");
	});

	it("renders tag pills (linking to the archive's tag filter) instead of the category when the post has tags", async () => {
		render(await LatestPostCard({ post }));

		expect(screen.getByRole("link", { name: "AI" })).toHaveAttribute("href", "/en/posts?tag=ai");
		expect(screen.getByRole("link", { name: "AI-Collections" })).toHaveAttribute("href", "/en/posts?tag=ai-collections");
		expect(screen.queryByText("News")).not.toBeInTheDocument();
	});

	it("falls back to the category pill (linking to the archive's category filter) when the post has no tags", async () => {
		const postWithoutTags: ISummaryProps = { ...post, tags: null };

		render(await LatestPostCard({ post: postWithoutTags }));

		expect(screen.getByRole("link", { name: "News" })).toHaveAttribute("href", "/en/posts?category=news");
	});

	it("falls back to the category pill when the post has an empty tags list", async () => {
		const postWithEmptyTags: ISummaryProps = { ...post, tags: { nodes: [] } };

		render(await LatestPostCard({ post: postWithEmptyTags }));

		expect(screen.getByRole("link", { name: "News" })).toHaveAttribute("href", "/en/posts?category=news");
	});

	it("renders no pill row when the post has neither tags nor categories", async () => {
		const postWithNeither: ISummaryProps = { ...post, tags: null, categories: null };

		render(await LatestPostCard({ post: postWithNeither }));

		expect(screen.queryByText("News")).not.toBeInTheDocument();
		expect(screen.queryByText("AI")).not.toBeInTheDocument();
	});

	it("does not render an image or read-time separator when missing", async () => {
		const postWithoutExtras: ISummaryProps = { ...post, featuredImage: null, seo: null };

		render(await LatestPostCard({ post: postWithoutExtras }));

		expect(screen.queryByRole("img")).not.toBeInTheDocument();
		expect(screen.queryByText(/min read/)).not.toBeInTheDocument();
	});
});
