import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import CommentsFeed from "@/app/posts/[slug]/fragments/CommentsFeed";
import type { IProps as IComment } from "@/graphql/CMS/types/comment";

const comments: IComment[] = [
	{
		id: "1",
		content: "<p>Great post!</p>",
		date: "2026-01-05T00:00:00",
		author: { node: { name: "Jane Doe", avatar: { url: "https://example.test/avatar.jpg" } } },
	},
];

describe("CommentsFeed", () => {
	it("renders each comment's author, date, and sanitized content", () => {
		render(<CommentsFeed comments={comments} />);

		expect(screen.getByText("Jane Doe")).toBeInTheDocument();
		expect(screen.getByText("Great post!")).toBeInTheDocument();
		expect(screen.getByText("Comments (1)")).toBeInTheDocument();
	});

	it("sanitizes comment content", () => {
		const { container } = render(
			<CommentsFeed comments={[{ ...comments[0], content: '<p>Hi</p><script>alert(1)</script>' }]} />,
		);

		expect(container.querySelector("script")).not.toBeInTheDocument();
		expect(screen.getByText("Hi")).toBeInTheDocument();
	});

	it("shows an empty-state invite rather than nothing when there are no comments", () => {
		render(<CommentsFeed comments={[]} />);

		expect(screen.getByText(/be the first to share your thoughts/i)).toBeInTheDocument();
	});
});
