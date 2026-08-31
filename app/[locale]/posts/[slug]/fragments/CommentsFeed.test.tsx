import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/app/[locale]/posts/[slug]/actions", () => ({
	submitComment: vi.fn(),
	setCommentReaction: vi.fn(),
}));

import CommentsFeed from "@/app/[locale]/posts/[slug]/fragments/CommentsFeed";
import type { IProps as IComment } from "@/graphql/CMS/types/comment";

const comments: IComment[] = [
	{
		id: "1",
		databaseId: 1,
		content: "<p>Great post!</p>",
		date: "2026-01-05T00:00:00",
		author: { node: { name: "Jane Doe", avatar: { url: "https://example.test/avatar.jpg" } } },
	},
];

describe("CommentsFeed", () => {
	it("renders each comment's author, date, and sanitized content", () => {
		render(<CommentsFeed postId={307} comments={comments} commentReactions={{}} />);

		expect(screen.getByText("Jane Doe")).toBeInTheDocument();
		expect(screen.getByText("Great post!")).toBeInTheDocument();
		expect(screen.getByText("1 Comment")).toBeInTheDocument();
	});

	it("sanitizes comment content", () => {
		const { container } = render(
			<CommentsFeed
				postId={307}
				comments={[{ ...comments[0], content: '<p>Hi</p><script>alert(1)</script>' }]}
				commentReactions={{}}
			/>,
		);

		expect(container.querySelector("script")).not.toBeInTheDocument();
		expect(screen.getByText("Hi")).toBeInTheDocument();
	});

	it("shows an empty-state invite rather than nothing when there are no comments", () => {
		render(<CommentsFeed postId={307} comments={[]} commentReactions={{}} />);

		expect(screen.getByText(/be the first to share your thoughts/i)).toBeInTheDocument();
	});

	it("opens an inline reply box when Reply is clicked, and closes it on Cancel", () => {
		render(<CommentsFeed postId={307} comments={comments} commentReactions={{}} />);

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
							databaseId: 2,
							content: "<p>Totally agree!</p>",
							date: "2026-01-06T00:00:00",
							author: { node: { name: "John Smith" } },
						},
					],
				},
			},
		];

		render(<CommentsFeed postId={307} comments={commentsWithReply} commentReactions={{}} />);

		expect(screen.getByText("John Smith")).toBeInTheDocument();
		expect(screen.getByText("Totally agree!")).toBeInTheDocument();
		// Only the top-level comment gets a Reply toggle, not its reply.
		expect(screen.getAllByRole("button", { name: "Reply" })).toHaveLength(1);
	});

	it("renders each comment's like/dislike counts from commentReactions, keyed by databaseId", () => {
		render(
			<CommentsFeed
				postId={307}
				comments={comments}
				commentReactions={{ 1: { likes: 4, dislikes: 2 } }}
			/>,
		);

		expect(screen.getByRole("button", { name: "Like this comment" })).toHaveTextContent("4");
		expect(screen.getByRole("button", { name: "Dislike this comment" })).toHaveTextContent("2");
	});

	it("defaults a comment's reactions to 0/0 when it has no entry in commentReactions", () => {
		render(<CommentsFeed postId={307} comments={comments} commentReactions={{}} />);

		expect(screen.getByRole("button", { name: "Like this comment" })).toHaveTextContent("0");
		expect(screen.getByRole("button", { name: "Dislike this comment" })).toHaveTextContent("0");
	});
});
