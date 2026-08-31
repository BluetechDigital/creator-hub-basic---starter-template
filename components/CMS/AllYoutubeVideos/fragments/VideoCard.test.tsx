import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
	useParams: () => ({ locale: "en" }),
}));

import VideoCard from "@/components/CMS/AllYoutubeVideos/fragments/VideoCard";
import type { IYoutubeVideos } from "@/api/YouTube/GetAllYoutubeContent";

const video = {
	videoId: "vid1",
	snippet: {
		title: "HeroVoltsy Plays Pokemon TCG",
		publishedAt: "2026-01-01T00:00:00Z",
		thumbnails: {
			high: { url: "https://i.ytimg.com/vi/vid1/hqdefault.jpg", width: 480, height: 360 },
			medium: { url: "https://i.ytimg.com/vi/vid1/mqdefault.jpg", width: 320, height: 180 },
			default: { url: "https://i.ytimg.com/vi/vid1/default.jpg", width: 120, height: 90 },
		},
	},
	statistics: { viewCount: "12500", likeCount: "980", favoriteCount: "0", commentCount: "42" },
} as unknown as IYoutubeVideos[number];

const dict = { views: "{count} views", likes: "{count} likes", comments: "{count} comments" };

describe("AllYoutubeVideos VideoCard", () => {
	it("renders the thumbnail, title, date, and a link to the internal video page", () => {
		render(<VideoCard video={video} dict={dict} />);

		expect(screen.getByText("HeroVoltsy Plays Pokemon TCG")).toBeInTheDocument();

		const thumbnail = screen.getByAltText("HeroVoltsy Plays Pokemon TCG");
		expect(decodeURIComponent(thumbnail.getAttribute("src") ?? "")).toContain(
			"https://i.ytimg.com/vi/vid1/hqdefault.jpg",
		);

		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("href", "/en/videos/herovoltsy-plays-pokemon-tcg-vid1");
		expect(link).not.toHaveAttribute("target");
	});

	it("renders formatted views, likes, and comments — no dislikes", () => {
		render(<VideoCard video={video} dict={dict} />);

		expect(screen.getByText("12.5K views")).toBeInTheDocument();
		expect(screen.getByText("980 likes")).toBeInTheDocument();
		expect(screen.getByText("42 comments")).toBeInTheDocument();
		expect(screen.queryByText(/dislike/i)).not.toBeInTheDocument();
	});
});
