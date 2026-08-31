import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
	useParams: () => ({ locale: "en" }),
}));

import FeaturedVideoCard from "@/components/CMS/AllYoutubeVideos/fragments/FeaturedVideoCard";
import type { IYoutubeVideos } from "@/api/YouTube/GetAllYoutubeContent";

const video = {
	videoId: "vid1",
	snippet: {
		title: "Featured Video",
		publishedAt: "2026-01-05T00:00:00Z",
		thumbnails: {
			high: { url: "https://i.ytimg.com/vi/vid1/hqdefault.jpg", width: 480, height: 360 },
			medium: { url: "https://i.ytimg.com/vi/vid1/mqdefault.jpg", width: 320, height: 180 },
			default: { url: "https://i.ytimg.com/vi/vid1/default.jpg", width: 120, height: 90 },
		},
	},
} as unknown as IYoutubeVideos[number];

describe("AllYoutubeVideos FeaturedVideoCard", () => {
	it("renders the title, date, thumbnail, and a link to the internal video page", () => {
		render(<FeaturedVideoCard video={video} />);

		expect(screen.getByText("Featured Video")).toBeInTheDocument();

		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("href", "/en/videos/featured-video-vid1");

		const image = screen.getByAltText("Featured Video");
		expect(decodeURIComponent(image.getAttribute("src") ?? "")).toContain(
			"https://i.ytimg.com/vi/vid1/hqdefault.jpg",
		);
	});
});
