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
	seo: { readingTime: 4 },
};

describe("LatestPosts LatestPostCard", () => {
	it("renders the title, image, excerpt, read time, and category tag", () => {
		render(<LatestPostCard post={post} />);

		expect(screen.getByText("Another Post")).toBeInTheDocument();
		expect(screen.getByText("A quick summary.")).toBeInTheDocument();
		expect(screen.getByText("4 min read")).toBeInTheDocument();
		expect(screen.getByText("News")).toBeInTheDocument();

		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("href", "/posts/another-post");

		const image = screen.getByAltText("Latest");
		expect(decodeURIComponent(image.getAttribute("src") ?? "")).toContain("https://example.test/latest.jpg");
	});

	it("does not render an image or read-time separator when missing", () => {
		const postWithoutExtras: ISummaryProps = { ...post, featuredImage: null, seo: null };

		render(<LatestPostCard post={postWithoutExtras} />);

		expect(screen.queryByRole("img")).not.toBeInTheDocument();
		expect(screen.queryByText(/min read/)).not.toBeInTheDocument();
	});
});
