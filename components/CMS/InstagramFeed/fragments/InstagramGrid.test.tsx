import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import InstagramGrid from "@/components/CMS/InstagramFeed/fragments/InstagramGrid";
import type { IInstagramFeed } from "@/api/Instagram/GetAllInstagramFeedContent";

const labels = {
	showMore: "Show more",
	empty: "The Instagram feed is unavailable right now.",
	previous: "Previous image",
	next: "Next image",
	viewOnInstagram: "View on Instagram",
};

const makePosts = (count: number): IInstagramFeed =>
	Array.from({ length: count }, (_, i) => ({
		id: `post-${i}`,
		media_type: "IMAGE" as const,
		media_url: `https://instagram.example/${i}.jpg`,
		timestamp: "2026-09-01T00:00:00+0000",
		caption: `Caption ${i}`,
		permalink: `https://instagram.com/p/${i}`,
		username: "creatorhub",
	}));

describe("InstagramGrid", () => {
	it("shows the empty-state message when there are no posts", () => {
		render(<InstagramGrid posts={[]} labels={labels} />);
		expect(screen.getByText(labels.empty)).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Show more" })).not.toBeInTheDocument();
	});

	it("renders only the first 9 tiles, then reveals the rest on Show more", () => {
		render(<InstagramGrid posts={makePosts(20)} labels={labels} />);

		expect(screen.getAllByRole("link")).toHaveLength(9);

		fireEvent.click(screen.getByRole("button", { name: "Show more" }));

		expect(screen.getAllByRole("link")).toHaveLength(20);
		expect(screen.queryByRole("button", { name: "Show more" })).not.toBeInTheDocument();
	});

	it("does not render a Show more button when there are 9 or fewer posts", () => {
		render(<InstagramGrid posts={makePosts(9)} labels={labels} />);
		expect(screen.getAllByRole("link")).toHaveLength(9);
		expect(screen.queryByRole("button", { name: "Show more" })).not.toBeInTheDocument();
	});

	it("uses the localised 'Show more' label it is given", () => {
		render(<InstagramGrid posts={makePosts(12)} labels={{ ...labels, showMore: "Onyesha zaidi" }} />);
		expect(screen.getByRole("button", { name: "Onyesha zaidi" })).toBeInTheDocument();
	});
});
