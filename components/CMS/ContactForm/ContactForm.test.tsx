import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockSubmitContactForm = vi.fn();

vi.mock("@/components/CMS/ContactForm/actions", () => ({
	submitContactForm: (...args: unknown[]) => mockSubmitContactForm(...args),
}));

import ContactForm from "@/components/CMS/ContactForm/ContactForm";
import type * as IContactForm from "@/components/CMS/ContactForm/types/contactForm";

const baseProps: Pick<IContactForm.IProps, "__typename" | "fieldGroupName"> = {
	__typename: "TestFieldGroup",
	fieldGroupName: "DefaultTemplate_Flexiblecontent_FlexibleContent_ContactForm",
};

describe("ContactForm", () => {
	beforeEach(() => {
		mockSubmitContactForm.mockReset();
	});

	it("renders name, email, and message fields", () => {
		render(<ContactForm {...baseProps} />);

		expect(screen.getByLabelText("Name")).toBeInTheDocument();
		expect(screen.getByLabelText("Email")).toBeInTheDocument();
		expect(screen.getByLabelText("Message")).toBeInTheDocument();
	});

	it("submits the form and shows a success message", async () => {
		mockSubmitContactForm.mockResolvedValue({ success: true });

		render(<ContactForm {...baseProps} />);

		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jane Doe" } });
		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "jane@example.test" } });
		fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Hello there, this is a message." } });

		fireEvent.click(screen.getByRole("button", { name: /send message/i }));

		await waitFor(() => {
			expect(screen.getByRole("status")).toHaveTextContent(/message has been sent/i);
		});

		expect(mockSubmitContactForm).toHaveBeenCalledWith(
			expect.objectContaining({ name: "Jane Doe", email: "jane@example.test" }),
		);
	});

	it("shows field errors returned from the server action", async () => {
		mockSubmitContactForm.mockResolvedValue({
			success: false,
			errors: { email: "Please enter a valid email address." },
		});

		render(<ContactForm {...baseProps} />);

		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jane Doe" } });
		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "invalid" } });
		fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Hello there, this is a message." } });

		fireEvent.click(screen.getByRole("button", { name: /send message/i }));

		await waitFor(() => {
			expect(screen.getByText("Please enter a valid email address.")).toBeInTheDocument();
		});
	});

	it("shows a general error message when the server action returns one", async () => {
		mockSubmitContactForm.mockResolvedValue({
			success: false,
			errors: { general: "Something went wrong sending your message. Please try again." },
		});

		render(<ContactForm {...baseProps} />);

		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jane Doe" } });
		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "jane@example.test" } });
		fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Hello there, this is a message." } });

		fireEvent.click(screen.getByRole("button", { name: /send message/i }));

		await waitFor(() => {
			expect(screen.getByRole("alert")).toHaveTextContent(/something went wrong/i);
		});
	});
});
