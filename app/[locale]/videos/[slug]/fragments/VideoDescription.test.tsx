import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import VideoDescription from "./VideoDescription";

const dict = { showMore: "Show more", showLess: "Show less" };

const makeWords = (count: number, word = "word") => Array.from({ length: count }, () => word).join(" ");

describe("VideoDescription", () => {
	it("renders the full text as-is when at or under the word limit, with no 'Show more' button", () => {
		const description = makeWords(100);
		render(<VideoDescription description={description} dict={dict} />);

		expect(screen.getByText(description)).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: /show more/i })).not.toBeInTheDocument();
	});

	it("truncates to the first 100 words with an ellipsis, behind a 'Show more' button, when longer", () => {
		const description = makeWords(150);
		render(<VideoDescription description={description} dict={dict} />);

		const truncated = `${makeWords(100)}…`;
		expect(screen.getByText(truncated)).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /show more/i })).toBeInTheDocument();
	});

	it("reveals the full text and swaps the button to 'Show less' once 'Show more' is clicked", () => {
		const description = makeWords(150);
		render(<VideoDescription description={description} dict={dict} />);

		fireEvent.click(screen.getByRole("button", { name: /show more/i }));

		expect(screen.getByText(description)).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: /show more/i })).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: /show less/i })).toBeInTheDocument();
	});

	it("re-truncates and swaps the button back to 'Show more' once 'Show less' is clicked", () => {
		const description = makeWords(150);
		render(<VideoDescription description={description} dict={dict} />);

		fireEvent.click(screen.getByRole("button", { name: /show more/i }));
		fireEvent.click(screen.getByRole("button", { name: /show less/i }));

		const truncated = `${makeWords(100)}…`;
		expect(screen.getByText(truncated)).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /show more/i })).toBeInTheDocument();
	});

	it("preserves the description's own line breaks (whitespace-pre-line, not stripped)", () => {
		const description = "Line one\nLine two";
		render(<VideoDescription description={description} dict={dict} />);

		expect(
			screen.getByText((_, element) => element?.tagName.toLowerCase() === "p" && element.textContent === description),
		).toBeInTheDocument();
	});
});
