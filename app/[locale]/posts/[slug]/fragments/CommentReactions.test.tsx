import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockSetCommentReaction = vi.fn();

vi.mock("@/app/[locale]/posts/[slug]/actions", () => ({
	setCommentReaction: (...args: unknown[]) => mockSetCommentReaction(...args),
}));

import CommentReactions from "@/app/[locale]/posts/[slug]/fragments/CommentReactions";

const clearReactionCookie = () => {
	document.cookie = "comment_reaction_2=; max-age=0; path=/";
};

describe("CommentReactions", () => {
	beforeEach(() => {
		mockSetCommentReaction.mockReset();
		clearReactionCookie();
	});

	afterEach(() => {
		clearReactionCookie();
	});

	it("renders the initial like and dislike counts", () => {
		render(<CommentReactions commentId={2} initialLikes={3} initialDislikes={1} />);

		expect(screen.getByRole("button", { name: "Like this comment" })).toHaveTextContent("3");
		expect(screen.getByRole("button", { name: "Dislike this comment" })).toHaveTextContent("1");
	});

	it("likes the comment and sets the reaction cookie on click", async () => {
		mockSetCommentReaction.mockResolvedValue({ success: true, likes: 4, dislikes: 1 });

		render(<CommentReactions commentId={2} initialLikes={3} initialDislikes={1} />);

		fireEvent.click(screen.getByRole("button", { name: "Like this comment" }));

		await waitFor(() => {
			expect(screen.getByRole("button", { name: "Like this comment" })).toHaveTextContent("4");
		});

		expect(mockSetCommentReaction).toHaveBeenCalledWith(2, undefined, "like");
		expect(document.cookie).toContain("comment_reaction_2=like");
		expect(screen.getByRole("button", { name: "Like this comment" })).toHaveAttribute("aria-pressed", "true");
	});

	it("swaps from like to dislike in one call", async () => {
		document.cookie = "comment_reaction_2=like; path=/";
		mockSetCommentReaction.mockResolvedValue({ success: true, likes: 2, dislikes: 2 });

		render(<CommentReactions commentId={2} initialLikes={3} initialDislikes={1} />);

		await waitFor(() => {
			expect(screen.getByRole("button", { name: "Like this comment" })).toHaveAttribute("aria-pressed", "true");
		});

		fireEvent.click(screen.getByRole("button", { name: "Dislike this comment" }));

		await waitFor(() => {
			expect(mockSetCommentReaction).toHaveBeenCalledWith(2, "like", "dislike");
		});

		expect(screen.getByRole("button", { name: "Like this comment" })).toHaveTextContent("2");
		expect(screen.getByRole("button", { name: "Dislike this comment" })).toHaveTextContent("2");
		expect(document.cookie).toContain("comment_reaction_2=dislike");
	});

	it("renders the previously-set reaction from the cookie on mount", () => {
		document.cookie = "comment_reaction_2=dislike; path=/";

		render(<CommentReactions commentId={2} initialLikes={3} initialDislikes={1} />);

		return waitFor(() => {
			expect(screen.getByRole("button", { name: "Dislike this comment" })).toHaveAttribute("aria-pressed", "true");
		});
	});

	it("does not bump the counts when setCommentReaction fails (e.g. mu-plugin not installed)", async () => {
		mockSetCommentReaction.mockResolvedValue({ success: false });

		render(<CommentReactions commentId={2} initialLikes={3} initialDislikes={1} />);

		fireEvent.click(screen.getByRole("button", { name: "Like this comment" }));

		await waitFor(() => {
			expect(mockSetCommentReaction).toHaveBeenCalled();
		});

		expect(screen.getByRole("button", { name: "Like this comment" })).toHaveTextContent("3");
		expect(screen.getByRole("button", { name: "Like this comment" })).toHaveAttribute("aria-pressed", "false");
	});
});
