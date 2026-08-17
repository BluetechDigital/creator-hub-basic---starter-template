import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import PostsGrid from "@/components/CMS/AllBlogPosts/fragments/PostsGrid";
import type { ISummaryProps } from "@/graphql/CMS/types/post";

const posts: ISummaryProps[] = [
	{
		title: "First Post",
		slug: "first-post",
		date: "2026-01-01T00:00:00",
		excerpt: "<p>First excerpt.</p>",
		featuredImage: null,
	},
	{
		title: "Second Post",
		slug: "second-post",
		date: "2026-01-02T00:00:00",
		excerpt: "<p>Second excerpt.</p>",
		featuredImage: null,
	},
];

describe("AllBlogPosts PostsGrid", () => {
	it("renders a card for each post", () => {
		render(<PostsGrid posts={posts} />);

		expect(screen.getByText("First Post")).toBeInTheDocument();
		expect(screen.getByText("Second Post")).toBeInTheDocument();
		expect(screen.getAllByRole("link")).toHaveLength(2);
	});

	it("renders nothing when there are no posts", () => {
		const { container } = render(<PostsGrid posts={[]} />);

		expect(container.querySelectorAll("a")).toHaveLength(0);
	});
});
