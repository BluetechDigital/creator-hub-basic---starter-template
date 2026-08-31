import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
	useParams: () => ({ locale: "en" }),
}));

import Pagination from "@/components/CMS/AllYoutubeVideos/fragments/Pagination";

const dict = {
	showMore: "Show more",
	paginationAriaLabel: "Video archive pagination",
	previous: "Previous",
	next: "Next",
};

describe("AllYoutubeVideos Pagination", () => {
	it("renders nothing when there's only one page", () => {
		const { container } = render(<Pagination currentPage={1} totalPages={1} dict={dict} />);

		expect(container).toBeEmptyDOMElement();
	});

	it("renders a single Show more link (to page 2) on page 1 when more pages exist", () => {
		render(<Pagination currentPage={1} totalPages={5} dict={dict} />);

		const link = screen.getByRole("link", { name: /show more/i });
		expect(link).toHaveAttribute("href", "/en/videos?page=2");
		expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
	});

	it("renders Previous/Next and numbered links on page 2 onward", () => {
		render(<Pagination currentPage={3} totalPages={5} dict={dict} />);

		expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute("href", "/en/videos?page=2");
		expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("href", "/en/videos?page=4");

		// Page 1 has no ?page= param at all.
		expect(screen.getByRole("link", { name: "1" })).toHaveAttribute("href", "/en/videos");
		expect(screen.getByRole("link", { name: "5" })).toHaveAttribute("href", "/en/videos?page=5");
	});

	it("marks the current page with aria-current and its own styling", () => {
		render(<Pagination currentPage={3} totalPages={5} dict={dict} />);

		const currentPageLink = screen.getByRole("link", { name: "3" });
		expect(currentPageLink).toHaveAttribute("aria-current", "page");

		expect(screen.getByRole("link", { name: "2" })).not.toHaveAttribute("aria-current");
	});

	it("collapses distant pages behind an ellipsis for a large totalPages", () => {
		render(<Pagination currentPage={5} totalPages={20} dict={dict} />);

		// Neighbours of the current page, plus first/last, are all present.
		expect(screen.getByRole("link", { name: "4" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "5" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "6" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "1" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "20" })).toBeInTheDocument();

		// Pages far from both the current page and the edges are collapsed.
		expect(screen.queryByRole("link", { name: "10" })).not.toBeInTheDocument();
	});

	it("disables Next on the last page", () => {
		render(<Pagination currentPage={5} totalPages={5} dict={dict} />);

		expect(screen.queryByRole("link", { name: "Next" })).not.toBeInTheDocument();
		expect(screen.getByText("Next")).toHaveAttribute("aria-disabled", "true");
	});
});
