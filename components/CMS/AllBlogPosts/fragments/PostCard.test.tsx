import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
	useParams: () => ({ locale: "en" }),
}));

import PostCard from "@/components/CMS/AllBlogPosts/fragments/PostCard";
import type { ISummaryProps } from "@/graphql/CMS/types/post";

const post: ISummaryProps = {
	title: "HeroVoltsy Announces New Merch",
	slug: "herovoltsy-announces-new-merch",
	date: "2026-01-01T00:00:00",
	excerpt: "<p>A quick rundown of the new merch drop.</p>",
	featuredImage: { node: { sourceUrl: "https://example.test/merch.jpg", altText: "New merch" } },
};

describe("AllBlogPosts PostCard", () => {
	it("renders the title, image, and a link to the post", () => {
		render(<PostCard post={post} />);

		expect(screen.getByText("HeroVoltsy Announces New Merch")).toBeInTheDocument();

		const image = screen.getByAltText("New merch");
		expect(image).toBeInTheDocument();
		expect(decodeURIComponent(image.getAttribute("src") ?? "")).toContain("https://example.test/merch.jpg");

		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("href", "/en/posts/herovoltsy-announces-new-merch");
	});

	it("renders the sanitized excerpt", () => {
		render(<PostCard post={post} />);

		expect(screen.getByText("A quick rundown of the new merch drop.")).toBeInTheDocument();
	});

	it("does not render an image when featuredImage is missing", () => {
		const postWithoutImage: ISummaryProps = { ...post, featuredImage: null };

		render(<PostCard post={postWithoutImage} />);

		expect(screen.queryByRole("img")).not.toBeInTheDocument();
	});
});
