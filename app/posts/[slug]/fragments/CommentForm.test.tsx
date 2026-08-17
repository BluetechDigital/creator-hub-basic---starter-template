import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockSubmitComment = vi.fn();

vi.mock("@/app/posts/[slug]/actions", () => ({
	submitComment: (...args: unknown[]) => mockSubmitComment(...args),
}));

import CommentForm from "@/app/posts/[slug]/fragments/CommentForm";

describe("CommentForm", () => {
	beforeEach(() => {
		mockSubmitComment.mockReset();
	});

	it("renders name, email, and comment fields", () => {
		render(<CommentForm postId={307} />);

		expect(screen.getByLabelText("Name")).toBeInTheDocument();
		expect(screen.getByLabelText("Email")).toBeInTheDocument();
		expect(screen.getByLabelText("Comment")).toBeInTheDocument();
	});

	it("submits the comment and shows an awaiting-approval message", async () => {
		mockSubmitComment.mockResolvedValue({ success: true });

		render(<CommentForm postId={307} />);

		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jane Doe" } });
		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "jane@example.test" } });
		fireEvent.change(screen.getByLabelText("Comment"), { target: { value: "Great post!" } });

		fireEvent.click(screen.getByRole("button", { name: /post comment/i }));

		await waitFor(() => {
			expect(screen.getByRole("status")).toHaveTextContent(/awaiting approval/i);
		});

		expect(mockSubmitComment).toHaveBeenCalledWith(
			expect.objectContaining({ name: "Jane Doe", email: "jane@example.test", content: "Great post!", postId: 307 }),
		);
	});

	it("shows field errors returned from the server action", async () => {
		mockSubmitComment.mockResolvedValue({
			success: false,
			errors: { email: "Please enter a valid email address." },
		});

		render(<CommentForm postId={307} />);

		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jane Doe" } });
		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "invalid" } });
		fireEvent.change(screen.getByLabelText("Comment"), { target: { value: "Great post!" } });

		fireEvent.click(screen.getByRole("button", { name: /post comment/i }));

		await waitFor(() => {
			expect(screen.getByText("Please enter a valid email address.")).toBeInTheDocument();
		});
	});
});
