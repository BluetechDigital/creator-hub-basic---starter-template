import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/navigation", () => ({
	useParams: () => ({ locale: "en" }),
}));

import VideosGrid from "@/components/CMS/AllYoutubeVideos/fragments/VideosGrid";
import type { IYoutubeVideos, IYoutubeChannelInfo, IYoutubePlaylists } from "@/api/YouTube/GetAllYoutubeContent";

const makeVideo = (n: number, publishedAt: string) => ({
	videoId: `vid${n}`,
	snippet: {
		title: `Video ${n}`,
		publishedAt,
		thumbnails: {
			high: { url: `https://i.ytimg.com/vi/vid${n}/hqdefault.jpg`, width: 480, height: 360 },
			medium: { url: `https://i.ytimg.com/vi/vid${n}/mqdefault.jpg`, width: 320, height: 180 },
			default: { url: `https://i.ytimg.com/vi/vid${n}/default.jpg`, width: 120, height: 90 },
		},
	},
	statistics: { viewCount: "100", likeCount: "10", favoriteCount: "0", commentCount: "1" },
}) as unknown as IYoutubeVideos[number];

const sixVideos = Array.from({ length: 6 }, (_, i) =>
	makeVideo(i + 1, `2026-01-${String(28 - i).padStart(2, '0')}T00:00:00Z`),
);

const youtubeChannelInfo = {} as IYoutubeChannelInfo;
const noPlaylists = [] as unknown as IYoutubePlaylists;

const dict = {
	searchAriaLabel: "Search videos",
	searchPlaceholder: "Search videos…",
	playlistAriaLabel: "Filter by playlist",
	allPlaylists: "All playlists",
	from: "From",
	to: "To",
	clearFilters: "Clear filters",
	showMore: "Show more",
	empty: "No videos published yet — check back soon.",
	noMatches: "No videos match these filters.",
	paginationAriaLabel: "Video archive pagination",
	previous: "Previous",
	next: "Next",
	views: "{count} views",
	likes: "{count} likes",
	comments: "{count} comments",
	eyebrow: "Videos",
	defaultHeading: "Latest videos",
	shortsEyebrow: "Shorts",
	shortsDefaultHeading: "Latest shorts",
	moreToWatch: "More to watch",
};

const titleLink = (title: string) => screen.getByText(title).closest("a");

describe("AllYoutubeVideos VideosGrid", () => {
	it("renders 2 hero cards and the rest in a flat grid on page 1", () => {
		render(
			<VideosGrid
				youtubeVideos={sixVideos}
				youtubeChannelInfo={youtubeChannelInfo}
				youtubeChannelPlaylists={noPlaylists}
				playlistVideoIds={{}}
				currentPage={1}
				totalPages={1}
				dict={dict}
			/>,
		);

		expect(titleLink("Video 1")).toHaveAttribute("href", "/en/videos/video-1-vid1");
		expect(titleLink("Video 2")).toHaveAttribute("href", "/en/videos/video-2-vid2");
		expect(screen.getByText("Video 3")).toBeInTheDocument();
		expect(screen.getByText("Video 6")).toBeInTheDocument();
	});

	it("renders no hero cards on page 2 — a flat grid only", () => {
		render(
			<VideosGrid
				youtubeVideos={sixVideos}
				youtubeChannelInfo={youtubeChannelInfo}
				youtubeChannelPlaylists={noPlaylists}
				playlistVideoIds={{}}
				currentPage={2}
				totalPages={2}
				dict={dict}
			/>,
		);

		// All 6 videos render as plain grid cards — none get the hero treatment.
		for (let n = 1; n <= 6; n++) {
			expect(screen.getByText(`Video ${n}`)).toBeInTheDocument();
		}
	});

	it("renders an empty-state message when there are no videos", () => {
		render(
			<VideosGrid
				youtubeVideos={[] as unknown as IYoutubeVideos}
				youtubeChannelInfo={youtubeChannelInfo}
				youtubeChannelPlaylists={noPlaylists}
				playlistVideoIds={{}}
				currentPage={1}
				totalPages={1}
				dict={dict}
			/>,
		);

		expect(screen.getByText(/no videos published yet/i)).toBeInTheDocument();
	});

	it("shows Pagination only when there's more than one page and no filter is active", () => {
		const { rerender } = render(
			<VideosGrid
				youtubeVideos={sixVideos}
				youtubeChannelInfo={youtubeChannelInfo}
				youtubeChannelPlaylists={noPlaylists}
				playlistVideoIds={{}}
				currentPage={1}
				totalPages={1}
				dict={dict}
			/>,
		);

		expect(screen.queryByRole("button", { name: /show more/i })).not.toBeInTheDocument();
		expect(screen.queryByRole("link", { name: /show more/i })).not.toBeInTheDocument();

		rerender(
			<VideosGrid
				youtubeVideos={sixVideos}
				youtubeChannelInfo={youtubeChannelInfo}
				youtubeChannelPlaylists={noPlaylists}
				playlistVideoIds={{}}
				currentPage={1}
				totalPages={3}
				dict={dict}
			/>,
		);

		expect(screen.getByRole("link", { name: /show more/i })).toHaveAttribute("href", "/en/videos?page=2");
	});

	it("hides Pagination while a filter is active", () => {
		render(
			<VideosGrid
				youtubeVideos={sixVideos}
				youtubeChannelInfo={youtubeChannelInfo}
				youtubeChannelPlaylists={noPlaylists}
				playlistVideoIds={{}}
				currentPage={1}
				totalPages={3}
				dict={dict}
			/>,
		);

		expect(screen.getByRole("link", { name: /show more/i })).toBeInTheDocument();

		fireEvent.change(screen.getByLabelText("Search videos"), { target: { value: "video 2" } });

		expect(screen.queryByRole("link", { name: /show more/i })).not.toBeInTheDocument();
	});

	it("drops the hero treatment while a filter is active, rendering a flat matching grid", () => {
		render(
			<VideosGrid
				youtubeVideos={sixVideos}
				youtubeChannelInfo={youtubeChannelInfo}
				youtubeChannelPlaylists={noPlaylists}
				playlistVideoIds={{}}
				currentPage={1}
				totalPages={1}
				dict={dict}
			/>,
		);

		fireEvent.change(screen.getByLabelText("Search videos"), { target: { value: "video 3" } });

		expect(screen.queryByText("Video 1")).not.toBeInTheDocument();
		expect(screen.getByText("Video 3")).toBeInTheDocument();
	});

	it("filters by playlist membership within the current page's videos", () => {
		const youtubeChannelPlaylists = [{ id: "pl1", title: "Playlist One" }] as unknown as IYoutubePlaylists;

		render(
			<VideosGrid
				youtubeVideos={sixVideos}
				youtubeChannelInfo={youtubeChannelInfo}
				youtubeChannelPlaylists={youtubeChannelPlaylists}
				playlistVideoIds={{ pl1: ["vid5"] }}
				currentPage={1}
				totalPages={1}
				dict={dict}
			/>,
		);

		fireEvent.change(screen.getByLabelText("Filter by playlist"), { target: { value: "pl1" } });

		expect(screen.queryByText("Video 1")).not.toBeInTheDocument();
		expect(screen.getByText("Video 5")).toBeInTheDocument();
	});

	it("shows a no-matches message when filters exclude every video", () => {
		render(
			<VideosGrid
				youtubeVideos={sixVideos}
				youtubeChannelInfo={youtubeChannelInfo}
				youtubeChannelPlaylists={noPlaylists}
				playlistVideoIds={{}}
				currentPage={1}
				totalPages={1}
				dict={dict}
			/>,
		);

		fireEvent.change(screen.getByLabelText("Search videos"), { target: { value: "nonexistent" } });

		expect(screen.getByText(/no videos match these filters/i)).toBeInTheDocument();
	});

	it("shows Clear filters when a filter is active, and restores the hero layout on click", () => {
		render(
			<VideosGrid
				youtubeVideos={sixVideos}
				youtubeChannelInfo={youtubeChannelInfo}
				youtubeChannelPlaylists={noPlaylists}
				playlistVideoIds={{}}
				currentPage={1}
				totalPages={1}
				dict={dict}
			/>,
		);

		fireEvent.change(screen.getByLabelText("Search videos"), { target: { value: "video 3" } });
		expect(screen.queryByText("Video 1")).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /clear filters/i }));

		expect(screen.getByText("Video 1")).toBeInTheDocument();
	});
});
