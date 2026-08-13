import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import VideosGrid from "@/components/CMS/AllYoutubeShortsVideos/fragments/VideosGrid";
import type { IYoutubeVideos, IYoutubeChannelInfo, IYoutubePlaylists } from "@/api/YouTube/GetAllYoutubeContent";

const youtubeVideos = [
	{
		kind: "youtube#video",
		etag: "etag1",
		id: "short1",
		videoId: "short1",
		snippet: {
			publishedAt: "2026-01-01T00:00:00Z",
			channelId: "UC_test_channel",
			title: "60 Second Pokemon TCG Tip",
			description: "A quick Pokemon TCG tip.",
			thumbnails: {
				default: { url: "https://i.ytimg.com/vi/short1/default.jpg", width: 120, height: 90 },
				medium: { url: "https://i.ytimg.com/vi/short1/mqdefault.jpg", width: 320, height: 180 },
				high: { url: "https://i.ytimg.com/vi/short1/hqdefault.jpg", width: 480, height: 360 },
			},
			channelTitle: "HeroVoltsy",
			categoryId: "20",
			liveBroadcastContent: "none",
			localized: { title: "60 Second Pokemon TCG Tip", description: "A quick Pokemon TCG tip." },
		},
		status: {
			uploadStatus: "processed",
			privacyStatus: "public",
			license: "youtube",
			embeddable: true,
			publicStatsViewable: true,
			madeForKids: false,
		},
		statistics: { viewCount: "5000", likeCount: "400", favoriteCount: "0", commentCount: "20" },
		contentDetails: {
			duration: "PT45S",
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

describe("AllYoutubeShortsVideos VideosGrid", () => {
	it("renders a thumbnail, title, and shorts link for each video", () => {
		render(
			<VideosGrid
				youtubeVideos={youtubeVideos}
				youtubeChannelInfo={youtubeChannelInfo}
				youtubeChannelPlaylists={youtubeChannelPlaylists}
			/>,
		);

		expect(screen.getByText("60 Second Pokemon TCG Tip")).toBeInTheDocument();

		const thumbnail = screen.getByAltText("60 Second Pokemon TCG Tip");
		expect(thumbnail).toBeInTheDocument();
		expect(decodeURIComponent(thumbnail.getAttribute("src") ?? "")).toContain(
			"https://i.ytimg.com/vi/short1/hqdefault.jpg",
		);

		const link = screen.getByRole("link", { name: /60 Second Pokemon TCG Tip/i });
		expect(link).toHaveAttribute("href", "https://www.youtube.com/shorts/short1");
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
