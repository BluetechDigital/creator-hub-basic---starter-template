import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

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

	it("still renders the search box when there are no categories or tags", () => {
		render(<PostFilters categories={[]} tags={[]} />);

		expect(screen.getByLabelText("Search posts")).toBeInTheDocument();
	});

	it("renders the search box, category select, and the tag search box", () => {
		render(<PostFilters categories={categories} tags={tags} />);

		expect(screen.getByLabelText("Search posts")).toBeInTheDocument();
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

	it("adds a tag when the search box is blurred with a value matching a suggestion, preserving other active params", () => {
		mockSearchParams.value = new URLSearchParams("category=uncategorized");

		render(<PostFilters categories={categories} tags={tags} />);

		const input = screen.getByLabelText("Search tags");
		fireEvent.change(input, { target: { value: "AI" } });
		fireEvent.blur(input);

		expect(mockReplace).toHaveBeenLastCalledWith("/posts?category=uncategorized&tag=ai");
	});

	it("adds a tag when Enter is pressed with a value matching a suggestion", () => {
		render(<PostFilters categories={categories} tags={tags} />);

		const input = screen.getByLabelText("Search tags");
		fireEvent.change(input, { target: { value: "AI" } });
		fireEvent.keyDown(input, { key: "Enter" });

		expect(mockReplace).toHaveBeenLastCalledWith("/posts?tag=ai");
	});

	it("does not navigate while the search box's value doesn't match any tag", () => {
		render(<PostFilters categories={categories} tags={tags} />);

		const input = screen.getByLabelText("Search tags");
		fireEvent.change(input, { target: { value: "a" } });
		fireEvent.blur(input);

		expect(mockReplace).not.toHaveBeenCalled();
	});

	it("does not auto-commit mid-typing when a shorter tag's name is a prefix of a longer one being typed", () => {
		// Regression test: typing "AI-Collections" character by character passes
		// through the exact text "AI" (a full match for the other tag) partway
		// through — this must not silently add "ai" and clear the box before the
		// visitor finishes typing.
		render(<PostFilters categories={categories} tags={tags} />);

		const input = screen.getByLabelText("Search tags");
		fireEvent.change(input, { target: { value: "AI" } });
		expect(mockReplace).not.toHaveBeenCalled();

		fireEvent.change(input, { target: { value: "AI-Collections" } });
		fireEvent.blur(input);

		expect(mockReplace).toHaveBeenLastCalledWith("/posts?tag=ai-collections");
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

	describe("title/content search", () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("does not navigate immediately while typing", () => {
			render(<PostFilters categories={categories} tags={tags} />);

			fireEvent.change(screen.getByLabelText("Search posts"), { target: { value: "hello" } });

			expect(mockReplace).not.toHaveBeenCalled();
		});

		it("navigates to ?search=<value> after the debounce delay", () => {
			render(<PostFilters categories={categories} tags={tags} />);

			fireEvent.change(screen.getByLabelText("Search posts"), { target: { value: "hello" } });
			act(() => { vi.advanceTimersByTime(400); });

			expect(mockReplace).toHaveBeenLastCalledWith("/posts?search=hello");
		});

		it("clears ?search= after the debounce delay once the box is emptied", () => {
			mockSearchParams.value = new URLSearchParams("search=hello");

			render(<PostFilters categories={categories} tags={tags} />);

			fireEvent.change(screen.getByLabelText("Search posts"), { target: { value: "" } });
			act(() => { vi.advanceTimersByTime(400); });

			expect(mockReplace).toHaveBeenLastCalledWith("/posts");
		});
	});

	it("syncs the search box's value from the URL when it changes externally (e.g. Clear filters)", () => {
		mockSearchParams.value = new URLSearchParams("search=hello");

		const { rerender } = render(<PostFilters categories={categories} tags={tags} />);

		expect(screen.getByLabelText("Search posts")).toHaveValue("hello");

		mockSearchParams.value = new URLSearchParams();
		rerender(<PostFilters categories={categories} tags={tags} />);

		expect(screen.getByLabelText("Search posts")).toHaveValue("");
	});
});
