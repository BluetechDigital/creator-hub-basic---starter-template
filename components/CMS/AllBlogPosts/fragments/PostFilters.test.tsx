import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockReplace = vi.fn();
const mockSearchParams = { value: new URLSearchParams() };

vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: mockReplace }),
	usePathname: () => "/posts",
	useSearchParams: () => mockSearchParams.value,
}));

import PostFilters from "@/components/CMS/AllBlogPosts/fragments/PostFilters";

const categories = [{ name: "Uncategorized", slug: "uncategorized" }];
const tags = [{ name: "AI", slug: "ai" }, { name: "AI-Collections", slug: "ai-collections" }];

describe("AllBlogPosts PostFilters", () => {
	beforeEach(() => {
		mockReplace.mockReset();
		mockSearchParams.value = new URLSearchParams();
	});

	it("renders nothing when there are no categories or tags", () => {
		const { container } = render(<PostFilters categories={[]} tags={[]} />);

		expect(container).toBeEmptyDOMElement();
	});

	it("renders the category select and the tag search box", () => {
		render(<PostFilters categories={categories} tags={tags} />);

		expect(screen.getByLabelText("Filter by category")).toBeInTheDocument();
		expect(screen.getByLabelText("Search tags")).toBeInTheDocument();
	});

	it("does not show a Clear filters control when no filter is active", () => {
		render(<PostFilters categories={categories} tags={tags} />);

		expect(screen.queryByRole("button", { name: /clear filters/i })).not.toBeInTheDocument();
	});

	it("navigates to ?category=<slug> when a category is selected", () => {
		render(<PostFilters categories={categories} tags={tags} />);

		fireEvent.change(screen.getByLabelText("Filter by category"), { target: { value: "uncategorized" } });

		expect(mockReplace).toHaveBeenCalledWith("/posts?category=uncategorized");
	});

	it("adds a tag when the search box's value matches a suggestion, preserving other active params", () => {
		mockSearchParams.value = new URLSearchParams("category=uncategorized");

		render(<PostFilters categories={categories} tags={tags} />);

		fireEvent.change(screen.getByLabelText("Search tags"), { target: { value: "AI" } });

		expect(mockReplace).toHaveBeenLastCalledWith("/posts?category=uncategorized&tag=ai");
	});

	it("does not navigate while the search box's value doesn't match any tag", () => {
		render(<PostFilters categories={categories} tags={tags} />);

		fireEvent.change(screen.getByLabelText("Search tags"), { target: { value: "a" } });

		expect(mockReplace).not.toHaveBeenCalled();
	});

	it("renders active tags as removable chips, and removes one on click", () => {
		mockSearchParams.value = new URLSearchParams("tag=ai,ai-collections");

		render(<PostFilters categories={categories} tags={tags} />);

		expect(screen.getByText("AI")).toBeInTheDocument();
		expect(screen.getByText("AI-Collections")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Remove AI filter" }));

		expect(mockReplace).toHaveBeenLastCalledWith("/posts?tag=ai-collections");
	});

	it("drops an active tag slug from the chip row if it no longer matches a known tag", () => {
		mockSearchParams.value = new URLSearchParams("tag=retired-tag");

		render(<PostFilters categories={categories} tags={tags} />);

		expect(screen.queryByRole("button", { name: /remove .* filter/i })).not.toBeInTheDocument();
	});

	it("shows Clear filters when a filter is active, and clears the query string on click", () => {
		mockSearchParams.value = new URLSearchParams("tag=ai");

		render(<PostFilters categories={categories} tags={tags} />);

		fireEvent.click(screen.getByRole("button", { name: /clear filters/i }));

		expect(mockReplace).toHaveBeenCalledWith("/posts");
	});

	it("sets the from/to date params", () => {
		render(<PostFilters categories={categories} tags={tags} />);

		fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-01-01" } });

		expect(mockReplace).toHaveBeenLastCalledWith("/posts?from=2026-01-01");
	});
});
