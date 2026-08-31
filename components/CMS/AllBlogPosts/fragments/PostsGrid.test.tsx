import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/navigation", () => ({
	useParams: () => ({ locale: "en" }),
}));

import PostsGrid from "@/components/CMS/AllBlogPosts/fragments/PostsGrid";
import type { ISummaryProps } from "@/graphql/CMS/types/post";

const makePost = (n: number, withImage = true): ISummaryProps => ({
	title: `Post ${n}`,
	slug: `post-${n}`,
	date: "2026-01-01T00:00:00",
	excerpt: `<p>Excerpt ${n}.</p>`,
	featuredImage: withImage
		? { node: { sourceUrl: `https://example.test/${n}.jpg`, altText: `Post ${n}` } }
		: null,
});

const dict = {
	empty: "No posts published yet — check back soon.",
	showMore: "Show more",
};

describe("AllBlogPosts PostsGrid", () => {
	it("renders the most recent post as the featured card and the rest in the grid", () => {
		const posts = [makePost(1), makePost(2), makePost(3)];

		render(<PostsGrid posts={posts} dict={dict} />);

		expect(screen.getByRole("link", { name: /post 1/i })).toHaveAttribute("href", "/en/posts/post-1");
		expect(screen.getByText("Post 2")).toBeInTheDocument();
		expect(screen.getByText("Post 3")).toBeInTheDocument();
	});

	it("falls back to a plain grid (no featured card) when the most recent post has no image", () => {
		const posts = [makePost(1, false), makePost(2)];

		render(<PostsGrid posts={posts} dict={dict} />);

		expect(screen.getAllByRole("link")).toHaveLength(2);
	});

	it("hides posts beyond the initial visible count behind a Show more button", () => {
		const posts = Array.from({ length: 9 }, (_, i) => makePost(i + 1));

		render(<PostsGrid posts={posts} dict={dict} />);

		// posts[0] is the featured card; posts[1..6] (6 posts) are initially
		// visible in the grid; posts[7..8] stay hidden until "Show more".
		expect(screen.getByText("Post 7")).toBeInTheDocument();
		expect(screen.queryByText("Post 8")).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /show more/i }));

		expect(screen.getByText("Post 8")).toBeInTheDocument();
		expect(screen.getByText("Post 9")).toBeInTheDocument();
	});

	it("renders an empty-state message when there are no posts", () => {
		render(<PostsGrid posts={[]} dict={dict} />);

		expect(screen.getByText(/no posts published yet/i)).toBeInTheDocument();
		expect(screen.queryAllByRole("link")).toHaveLength(0);
	});
});
