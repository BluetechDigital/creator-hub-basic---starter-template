/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IThemesOptions from "@/graphql/CMS/types/themesOptions";
import { IYoutubeVideos } from "@/api/YouTube/GetAllYoutubeContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Person Schema XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Builds a Person-typed schema.org object describing the site/creator, including
 * social links pulled from theme options. Uses "Person" rather than "Organization"
 * to match the single-creator framing of a "Creator Hub" — swap to "Organization"
 * here if a client build represents a brand/team instead.
 * @param siteName The site/creator's display name, used as the schema's `name`.
 * @param siteUrl The site's canonical URL, used as the schema's `url`.
 * @param themeOptions The CMS's "Global Content" theme options (social links, email).
 * Optional/nullable: that options page can legitimately have no data yet —
 * `getThemesOptionsContent()`'s real return type is loose even though `IGlobal.IProps`
 * asserts it non-null, and this is the one place that assertion gets dereferenced
 * directly, so it has to hold up at runtime too. Note: `IThemesOptions.IProps` also
 * declares `youtubeLink`/`instagramLink`, but those aren't real ACF fields on this
 * WordPress instance's "Global Content" options page (confirmed via direct GraphQL
 * introspection — querying them errors the whole request) — the type is aspirational
 * there, not synced to the live schema, so they're deliberately left out of `sameAs`
 * below rather than silently fetched as undefined.
 * @returns A schema.org `Person` object, with `email` and `sameAs` included only when
 * present.
 */
export const buildPersonSchema = ({
	siteName,
	siteUrl,
	themeOptions,
}: {
	siteName: string;
	siteUrl: string;
	themeOptions?: IThemesOptions.IProps | null;
}) => {
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

/**
 * Builds a WebSite-typed schema.org object. Deliberately omits `SearchAction` since
 * there's no live site search page to describe.
 * @param siteName The site's display name, used as the schema's `name`.
 * @param siteUrl The site's canonical URL, used as the schema's `url`.
 * @returns A schema.org `WebSite` object.
 */
export const buildWebsiteSchema = ({ siteName, siteUrl }: { siteName: string; siteUrl: string }) => ({
	"@context": "https://schema.org",
	"@type": "WebSite",
	name: siteName,
	url: siteUrl,
});

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX BreadcrumbList Schema XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Builds a two-level BreadcrumbList schema.org object: Home followed by the current
 * page.
 * @param siteUrl The site's canonical URL, used as the "Home" breadcrumb's `item`
 * and as the base for the current page's URL.
 * @param slug The current page's slug, appended to `siteUrl` for the second breadcrumb.
 * @param pageTitle The current page's title, used as the second breadcrumb's `name`.
 * @returns A schema.org `BreadcrumbList` object with two `ListItem` entries.
 */
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

/**
 * Builds a VideoObject schema.org object from a single YouTube video's API data.
 * @param video A single video entry as returned by the YouTube Data API.
 * @param watchUrl The video's public watch URL (e.g.
 * `https://www.youtube.com/watch?v=...`), used as `contentUrl`.
 * @returns A schema.org `VideoObject`, with `thumbnailUrl` filtered to only the
 * resolutions that are actually present.
 */
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

/**
 * Builds an ItemList schema.org object wrapping a list of videos, each rendered via
 * {@link buildVideoObjectSchema}.
 * @param videos The list of YouTube videos to include, in display order.
 * @param watchUrlBuilder Builds a video's public watch URL from its video ID; passed
 * through to {@link buildVideoObjectSchema} per item.
 * @returns A schema.org `ItemList` whose `itemListElement` entries are positioned
 * `ListItem`s wrapping each video's `VideoObject`.
 */
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
