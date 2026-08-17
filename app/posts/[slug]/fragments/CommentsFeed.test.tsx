import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/app/posts/[slug]/actions", () => ({
	submitComment: vi.fn(),
}));

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
		render(<CommentsFeed postId={307} comments={comments} />);

		expect(screen.getByText("Jane Doe")).toBeInTheDocument();
		expect(screen.getByText("Great post!")).toBeInTheDocument();
		expect(screen.getByText("1 Comment")).toBeInTheDocument();
	});

	it("sanitizes comment content", () => {
		const { container } = render(
			<CommentsFeed postId={307} comments={[{ ...comments[0], content: '<p>Hi</p><script>alert(1)</script>' }]} />,
		);

		expect(container.querySelector("script")).not.toBeInTheDocument();
		expect(screen.getByText("Hi")).toBeInTheDocument();
	});

	it("shows an empty-state invite rather than nothing when there are no comments", () => {
		render(<CommentsFeed postId={307} comments={[]} />);

		expect(screen.getByText(/be the first to share your thoughts/i)).toBeInTheDocument();
	});

	it("opens an inline reply box when Reply is clicked, and closes it on Cancel", () => {
		render(<CommentsFeed postId={307} comments={comments} />);

		expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Reply" }));
		expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
	});

	it("renders replies nested under their parent comment without their own Reply toggle", () => {
		const commentsWithReply: IComment[] = [
			{
				...comments[0],
				replies: {
					nodes: [
						{
							id: "2",
							content: "<p>Totally agree!</p>",
							date: "2026-01-06T00:00:00",
							author: { node: { name: "John Smith" } },
						},
					],
				},
			},
		];

		render(<CommentsFeed postId={307} comments={commentsWithReply} />);

		expect(screen.getByText("John Smith")).toBeInTheDocument();
		expect(screen.getByText("Totally agree!")).toBeInTheDocument();
		// Only the top-level comment gets a Reply toggle, not its reply.
		expect(screen.getAllByRole("button", { name: "Reply" })).toHaveLength(1);
	});
});
