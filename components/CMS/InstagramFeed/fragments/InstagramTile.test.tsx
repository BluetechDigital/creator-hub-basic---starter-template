import { describe, it, expect, beforeAll } from "vitest";
import { render, screen, within } from "@testing-library/react";

import InstagramTile from "@/components/CMS/InstagramFeed/fragments/InstagramTile";
import type { IInstagramFeed } from "@/api/Instagram/GetAllInstagramFeedContent";

const labels = { previous: "Previous image", next: "Next image", viewOnInstagram: "View on Instagram" };

type IPost = IInstagramFeed[number];

const basePost: IPost = {
	id: "p1",
	media_type: "IMAGE",
	media_url: "https://instagram.example/1.jpg",
	timestamp: "2026-09-01T00:00:00+0000",
	caption: "A caption",
	permalink: "https://instagram.com/p/DdBWaPfEcQi",
	username: "creatorhub",
	like_count: 31,
	comments_count: 4,
};

const carouselPost: IPost = {
	...basePost,
	media_type: "CAROUSEL_ALBUM",
	children: {
		data: [
			{ id: "c1", media_type: "IMAGE", media_url: "https://instagram.example/a.jpg" },
			{ id: "c2", media_type: "IMAGE", media_url: "https://instagram.example/b.jpg" },
			{ id: "c3", media_type: "VIDEO", media_url: "https://instagram.example/c.mp4", thumbnail_url: "https://instagram.example/c.jpg" },
		],
	},
};

beforeAll(() => {
	// jsdom has no layout — give the scroll helpers something to work with.
	Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, value: 300 });
	HTMLElement.prototype.scrollTo = function scrollTo() {};
	window.matchMedia = window.matchMedia || (() => ({ matches: false }) as MediaQueryList);
});

describe("InstagramTile", () => {
	it("links to the post permalink and shows the like/comment counts", () => {
		render(<InstagramTile post={basePost} labels={labels} />);

		const link = screen.getByRole("link", { name: /view on instagram/i });
		expect(link).toHaveAttribute("href", "https://instagram.com/p/DdBWaPfEcQi");
		expect(link).toHaveAttribute("target", "_blank");
		expect(within(link).getByText("31")).toBeInTheDocument();
		expect(within(link).getByText("4")).toBeInTheDocument();
	});

	it("renders no arrows or dots for a single-image post", () => {
		render(<InstagramTile post={basePost} labels={labels} />);
		expect(screen.queryByRole("button", { name: "Next image" })).not.toBeInTheDocument();
	});

	it("renders arrows and one dot per slide for a carousel", () => {
		render(<InstagramTile post={carouselPost} labels={labels} />);

		expect(screen.getByRole("button", { name: "Previous image" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Next image" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "1 / 3" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "3 / 3" })).toBeInTheDocument();
	});

	it("disables the Previous arrow on the first slide", () => {
		render(<InstagramTile post={carouselPost} labels={labels} />);
		expect(screen.getByRole("button", { name: "Previous image" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next image" })).toBeEnabled();
	});

	it("omits the stats overlay content when counts are missing", () => {
		const { like_count, comments_count, ...noCounts } = basePost;
		void like_count;
		void comments_count;
		render(<InstagramTile post={noCounts as IPost} labels={labels} />);
		expect(screen.queryByText("31")).not.toBeInTheDocument();
	});
});
