import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import VideosGrid from "@/components/CMS/AllYoutubeVideos/fragments/VideosGrid";
import type { IYoutubeVideos, IYoutubeChannelInfo, IYoutubePlaylists } from "@/api/YouTube/GetAllYoutubeContent";

const youtubeVideos = [
	{
		kind: "youtube#video",
		etag: "etag1",
		id: "vid1",
		videoId: "vid1",
		snippet: {
			publishedAt: "2026-01-01T00:00:00Z",
			channelId: "UC_test_channel",
			title: "HeroVoltsy Plays Pokemon TCG",
			description: "A Pokemon TCG deep dive.",
			thumbnails: {
				default: { url: "https://i.ytimg.com/vi/vid1/default.jpg", width: 120, height: 90 },
				medium: { url: "https://i.ytimg.com/vi/vid1/mqdefault.jpg", width: 320, height: 180 },
				high: { url: "https://i.ytimg.com/vi/vid1/hqdefault.jpg", width: 480, height: 360 },
			},
			channelTitle: "HeroVoltsy",
			categoryId: "20",
			liveBroadcastContent: "none",
			localized: { title: "HeroVoltsy Plays Pokemon TCG", description: "A Pokemon TCG deep dive." },
		},
		status: {
			uploadStatus: "processed",
			privacyStatus: "public",
			license: "youtube",
			embeddable: true,
			publicStatsViewable: true,
			madeForKids: false,
		},
		statistics: { viewCount: "1000", likeCount: "100", favoriteCount: "0", commentCount: "10" },
		contentDetails: {
			duration: "PT4M13S",
			dimension: "2d",
			definition: "hd",
			caption: "false",
			licensedContent: true,
			projection: "rectangular",
		},
		player: { embedHtml: "<iframe></iframe>" },
	},
] as unknown as IYoutubeVideos;

const youtubeChannelInfo = {} as IYoutubeChannelInfo;
const youtubeChannelPlaylists = [] as unknown as IYoutubePlaylists;

describe("AllYoutubeVideos VideosGrid", () => {
	it("renders a thumbnail, title, and watch link for each video", () => {
		render(
			<VideosGrid
				youtubeVideos={youtubeVideos}
				youtubeChannelInfo={youtubeChannelInfo}
				youtubeChannelPlaylists={youtubeChannelPlaylists}
			/>,
		);

		expect(screen.getByText("HeroVoltsy Plays Pokemon TCG")).toBeInTheDocument();

		const thumbnail = screen.getByAltText("HeroVoltsy Plays Pokemon TCG");
		expect(thumbnail).toBeInTheDocument();
		expect(decodeURIComponent(thumbnail.getAttribute("src") ?? "")).toContain(
			"https://i.ytimg.com/vi/vid1/hqdefault.jpg",
		);

		const link = screen.getByRole("link", { name: /HeroVoltsy Plays Pokemon TCG/i });
		expect(link).toHaveAttribute("href", "https://www.youtube.com/watch?v=vid1");
		expect(link).toHaveAttribute("target", "_blank");
	});

	it("renders nothing when there are no videos", () => {
		const { container } = render(
			<VideosGrid
				youtubeVideos={[] as unknown as IYoutubeVideos}
				youtubeChannelInfo={youtubeChannelInfo}
				youtubeChannelPlaylists={youtubeChannelPlaylists}
			/>,
		);

		expect(container.querySelectorAll("a")).toHaveLength(0);
	});
});
