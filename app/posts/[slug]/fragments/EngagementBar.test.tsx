import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockSetReaction = vi.fn();

vi.mock("@/app/posts/[slug]/actions", () => ({
	setReaction: (...args: unknown[]) => mockSetReaction(...args),
}));

import EngagementBar from "@/app/posts/[slug]/fragments/EngagementBar";

const clearReactionCookie = () => {
	document.cookie = "reaction_307=; max-age=0; path=/";
};

describe("EngagementBar", () => {
	beforeEach(() => {
		mockSetReaction.mockReset();
		clearReactionCookie();
	});

	afterEach(() => {
		clearReactionCookie();
	});

	it("renders the initial like, dislike, and comment counts", () => {
		render(<EngagementBar postId={307} initialLikes={4} initialDislikes={1} commentCount={2} />);

		expect(screen.getByText("4")).toBeInTheDocument();
		expect(screen.getByText("1")).toBeInTheDocument();
		expect(screen.getByText("2")).toBeInTheDocument();
	});

	it("links the comment count to #comments", () => {
		render(<EngagementBar postId={307} initialLikes={4} initialDislikes={1} commentCount={2} />);

		expect(screen.getByRole("link")).toHaveAttribute("href", "#comments");
	});

	it("likes the post and sets the reaction cookie on click", async () => {
		mockSetReaction.mockResolvedValue({ success: true, likes: 5, dislikes: 1 });

		render(<EngagementBar postId={307} initialLikes={4} initialDislikes={1} commentCount={2} />);

		fireEvent.click(screen.getByRole("button", { name: "Like this post" }));

		await waitFor(() => {
			expect(screen.getByText("5")).toBeInTheDocument();
		});

		expect(mockSetReaction).toHaveBeenCalledWith(307, undefined, "like");
		expect(document.cookie).toContain("reaction_307=like");
		expect(screen.getByRole("button", { name: "Like this post" })).toHaveAttribute("aria-pressed", "true");
	});

	it("swaps from like to dislike in one call, decrementing likes and incrementing dislikes", async () => {
		document.cookie = "reaction_307=like; path=/";
		mockSetReaction.mockResolvedValue({ success: true, likes: 3, dislikes: 2 });

		render(<EngagementBar postId={307} initialLikes={4} initialDislikes={1} commentCount={2} />);

		await waitFor(() => {
			expect(screen.getByRole("button", { name: "Like this post" })).toHaveAttribute("aria-pressed", "true");
		});

		fireEvent.click(screen.getByRole("button", { name: "Dislike this post" }));

		await waitFor(() => {
			expect(mockSetReaction).toHaveBeenCalledWith(307, "like", "dislike");
		});

		expect(screen.getByRole("button", { name: "Like this post" })).toHaveTextContent("3");
		expect(screen.getByRole("button", { name: "Dislike this post" })).toHaveTextContent("2");
		expect(document.cookie).toContain("reaction_307=dislike");
		expect(screen.getByRole("button", { name: "Dislike this post" })).toHaveAttribute("aria-pressed", "true");
		expect(screen.getByRole("button", { name: "Like this post" })).toHaveAttribute("aria-pressed", "false");
	});

	it("clicking the already-active reaction clears it back to neither", async () => {
		document.cookie = "reaction_307=like; path=/";
		mockSetReaction.mockResolvedValue({ success: true, likes: 3, dislikes: 1 });

		render(<EngagementBar postId={307} initialLikes={4} initialDislikes={1} commentCount={2} />);

		await waitFor(() => {
			expect(screen.getByRole("button", { name: "Like this post" })).toHaveAttribute("aria-pressed", "true");
		});

		fireEvent.click(screen.getByRole("button", { name: "Like this post" }));

		await waitFor(() => {
			expect(mockSetReaction).toHaveBeenCalledWith(307, "like", "none");
		});

		expect(document.cookie).not.toContain("reaction_307=like");
		expect(screen.getByRole("button", { name: "Like this post" })).toHaveAttribute("aria-pressed", "false");
	});

	it("renders the previously-set reaction from the cookie on mount", () => {
		document.cookie = "reaction_307=dislike; path=/";

		render(<EngagementBar postId={307} initialLikes={4} initialDislikes={1} commentCount={2} />);

		return waitFor(() => {
			expect(screen.getByRole("button", { name: "Dislike this post" })).toHaveAttribute("aria-pressed", "true");
		});
	});

	it("does not bump the counts when setReaction fails (e.g. mu-plugin not installed)", async () => {
		mockSetReaction.mockResolvedValue({ success: false });

		render(<EngagementBar postId={307} initialLikes={4} initialDislikes={1} commentCount={2} />);

		fireEvent.click(screen.getByRole("button", { name: "Like this post" }));

		await waitFor(() => {
			expect(mockSetReaction).toHaveBeenCalled();
		});

		expect(screen.getByText("4")).toBeInTheDocument();
		expect(screen.getByText("1")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Like this post" })).toHaveAttribute("aria-pressed", "false");
	});
});
