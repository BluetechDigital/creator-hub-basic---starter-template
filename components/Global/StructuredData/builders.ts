/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IThemesOptions from "@/graphql/CMS/types/themesOptions";
import { IYoutubeVideos } from "@/api/YouTube/GetAllYoutubeContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Person Schema XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// "Person" matches the single-creator framing of a "Creator Hub" — swap to
// "Organization" here if a client build represents a brand/team instead.
export const buildPersonSchema = ({
	siteName,
	siteUrl,
	themeOptions,
}: {
	siteName: string;
	siteUrl: string;
	// Optional/nullable: the CMS's "Global Content" theme options page can legitimately
	// have no data yet (getThemesOptionsContent()'s real return type is loose even
	// though IGlobal.IProps asserts it non-null — this is the one place that assertion
	// gets dereferenced directly, so it has to hold up at runtime too).
	themeOptions?: IThemesOptions.IProps | null;
}) => {
	// Note: IThemesOptions.IProps also declares youtubeLink/instagramLink, but those
	// aren't real ACF fields on this WordPress instance's "Global Content" options page
	// (confirmed via direct GraphQL introspection — querying them errors the whole
	// request) — the type is aspirational there, not synced to the live schema, so
	// they're deliberately left out of sameAs rather than silently fetched as undefined.
	const sameAs = [
		themeOptions?.tiktokLink?.url,
		themeOptions?.twitchLink?.url,
		themeOptions?.twitterLink?.url,
		themeOptions?.facebookLink?.url,
		themeOptions?.linkedinLink?.url,
		themeOptions?.spotifyLink?.url,
		themeOptions?.threadsLink?.url,
		themeOptions?.discordLink?.url,
		themeOptions?.pinterestLink?.url,
		themeOptions?.snapchatLink?.url,
		themeOptions?.redditLink?.url,
	].filter((url): url is string => Boolean(url));

	return {
		"@context": "https://schema.org",
		"@type": "Person",
		name: siteName,
		url: siteUrl,
		...(themeOptions?.email ? { email: themeOptions.email } : {}),
		...(sameAs.length ? { sameAs } : {}),
	};
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX WebSite Schema XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// No SearchAction — there's no live site search page to describe.
export const buildWebsiteSchema = ({ siteName, siteUrl }: { siteName: string; siteUrl: string }) => ({
	"@context": "https://schema.org",
	"@type": "WebSite",
	name: siteName,
	url: siteUrl,
});

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX BreadcrumbList Schema XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export const buildBreadcrumbListSchema = ({
	siteUrl,
	slug,
	pageTitle,
}: {
	siteUrl: string;
	slug: string;
	pageTitle: string;
}) => ({
	"@context": "https://schema.org",
	"@type": "BreadcrumbList",
	itemListElement: [
		{
			"@type": "ListItem",
			position: 1,
			name: "Home",
			item: siteUrl,
		},
		{
			"@type": "ListItem",
			position: 2,
			name: pageTitle,
			item: `${siteUrl}/${slug}`,
		},
	],
});

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX VideoObject Schema XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export const buildVideoObjectSchema = (video: IYoutubeVideos[number], watchUrl: string) => ({
	"@context": "https://schema.org",
	"@type": "VideoObject",
	name: video.snippet.title,
	description: video.snippet.description,
	thumbnailUrl: [
		video.snippet.thumbnails.high?.url,
		video.snippet.thumbnails.medium?.url,
		video.snippet.thumbnails.default?.url,
	].filter((url): url is string => Boolean(url)),
	uploadDate: video.snippet.publishedAt,
	duration: video.contentDetails.duration,
	embedUrl: `https://www.youtube.com/embed/${video.videoId}`,
	contentUrl: watchUrl,
	interactionStatistic: {
		"@type": "InteractionCounter",
		interactionType: "https://schema.org/WatchAction",
		userInteractionCount: Number(video.statistics.viewCount) || 0,
	},
});

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Video ItemList Schema XXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export const buildVideoItemListSchema = (
	videos: IYoutubeVideos,
	watchUrlBuilder: (videoId: string) => string,
) => ({
	"@context": "https://schema.org",
	"@type": "ItemList",
	itemListElement: videos.map((video, index) => ({
		"@type": "ListItem",
		position: index + 1,
		item: buildVideoObjectSchema(video, watchUrlBuilder(video.videoId)),
	})),
});
