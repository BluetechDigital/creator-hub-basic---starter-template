import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockSubmitComment = vi.fn();

vi.mock("@/app/[locale]/posts/[slug]/actions", () => ({
	submitComment: (...args: unknown[]) => mockSubmitComment(...args),
}));

import CommentForm from "@/app/[locale]/posts/[slug]/fragments/CommentForm";

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

	it("submits the comment and shows a confirmation message", async () => {
		mockSubmitComment.mockResolvedValue({ success: true });

		render(<CommentForm postId={307} />);

		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jane Doe" } });
		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "jane@example.test" } });
		fireEvent.change(screen.getByLabelText("Comment"), { target: { value: "Great post!" } });

		fireEvent.click(screen.getByRole("button", { name: /post comment/i }));

		await waitFor(() => {
			expect(screen.getByRole("status")).toHaveTextContent(/thanks for your comment/i);
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

	it("renders as a compact reply box with a Reply submit button and Cancel button when parentId/onCancel are set", () => {
		const onCancel = vi.fn();

		render(<CommentForm postId={307} parentId="Y29tbWVudDoy" onCancel={onCancel} />);

		expect(screen.queryByText("Leave a comment")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: /^reply$/i })).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(onCancel).toHaveBeenCalledTimes(1);
	});

	it("submits a reply with the parentId included", async () => {
		mockSubmitComment.mockResolvedValue({ success: true });

		render(<CommentForm postId={307} parentId="Y29tbWVudDoy" onCancel={vi.fn()} />);

		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jane Doe" } });
		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "jane@example.test" } });
		fireEvent.change(screen.getByLabelText("Reply"), { target: { value: "Totally agree!" } });

		fireEvent.click(screen.getByRole("button", { name: /^reply$/i }));

		await waitFor(() => {
			expect(screen.getByRole("status")).toHaveTextContent(/thanks for your reply/i);
		});

		expect(mockSubmitComment).toHaveBeenCalledWith(
			expect.objectContaining({ postId: 307, parentId: "Y29tbWVudDoy", content: "Totally agree!" }),
		);
	});

	it("uses unique field ids so a main form and an open reply box never collide", () => {
		render(
			<>
				<CommentForm postId={307} />
				<CommentForm postId={307} parentId="Y29tbWVudDoy" onCancel={vi.fn()} />
			</>,
		);

		const nameInputs = screen.getAllByLabelText("Name") as HTMLInputElement[];
		expect(nameInputs).toHaveLength(2);
		expect(nameInputs[0].id).not.toBe(nameInputs[1].id);
	});
});
