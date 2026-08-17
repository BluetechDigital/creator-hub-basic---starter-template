import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockIncrementLike = vi.fn();

vi.mock("@/app/posts/[slug]/actions", () => ({
	incrementLike: (...args: unknown[]) => mockIncrementLike(...args),
}));

import EngagementBar from "@/app/posts/[slug]/fragments/EngagementBar";

describe("EngagementBar", () => {
	beforeEach(() => {
		mockIncrementLike.mockReset();
		document.cookie = "liked_307=; max-age=0; path=/";
	});

	afterEach(() => {
		document.cookie = "liked_307=; max-age=0; path=/";
	});

	it("renders the initial like and comment counts", () => {
		render(<EngagementBar postId={307} initialLikes={4} commentCount={2} />);

		expect(screen.getByText("4")).toBeInTheDocument();
		expect(screen.getByText("2")).toBeInTheDocument();
	});

	it("links the comment count to #comments", () => {
		render(<EngagementBar postId={307} initialLikes={4} commentCount={2} />);

		expect(screen.getByRole("link")).toHaveAttribute("href", "#comments");
	});

	it("increments the like count and sets the already-liked cookie on click", async () => {
		mockIncrementLike.mockResolvedValue({ success: true, likes: 5 });

		render(<EngagementBar postId={307} initialLikes={4} commentCount={2} />);

		fireEvent.click(screen.getByRole("button"));

		await waitFor(() => {
			expect(screen.getByText("5")).toBeInTheDocument();
		});

		expect(mockIncrementLike).toHaveBeenCalledWith(307);
		expect(document.cookie).toContain("liked_307=1");
		expect(screen.getByRole("button")).toBeDisabled();
	});

	it("renders the like button already disabled when the liked cookie is already set", () => {
		document.cookie = "liked_307=1; path=/";

		render(<EngagementBar postId={307} initialLikes={4} commentCount={2} />);

		return waitFor(() => {
			expect(screen.getByRole("button")).toBeDisabled();
		});
	});

	it("does not bump the count when incrementLike fails (e.g. mu-plugin not installed)", async () => {
		mockIncrementLike.mockResolvedValue({ success: false });

		render(<EngagementBar postId={307} initialLikes={4} commentCount={2} />);

		fireEvent.click(screen.getByRole("button"));

		await waitFor(() => {
			expect(mockIncrementLike).toHaveBeenCalled();
		});

		expect(screen.getByText("4")).toBeInTheDocument();
		expect(screen.getByRole("button")).not.toBeDisabled();
	});
});
