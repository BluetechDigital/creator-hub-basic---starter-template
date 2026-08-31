/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { MetadataRoute } from "next";

// Pages
import { getAllPagesSlugs } from "@/graphql/CMS/GetAllPagesSlugs";

// Posts
import { getAllPostsSlugs } from "@/graphql/CMS/GetAllPostsSlugs";

// Videos
import { getAllQualifyingVideoSummaries, buildVideoSlug } from "@/api/YouTube/GetAllYoutubeContent";

// Locale-aware hreflang
import { defaultLocale } from "@/context/constants";
import { buildLocaleAlternates } from "@/i18n/buildAlternates";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

//  Define types for slug data and sitemap entries
type IKeys = {
	slug: string;
	modified: string;
};

// Videos use `videoId`/`title` (built into the actual /videos/[slug] route
// param via `buildVideoSlug`, see app/[locale]/videos/[slug]/page.tsx) and
// `publishedAt` in place of `slug`/`modified`.
type IVideoKeys = {
	videoId: string;
	publishedAt: string;
	title: string;
};

// Define the structure of sitemap entry objects — field names match Next's
// actual `MetadataRoute.Sitemap` entry shape (`lastModified`/`changeFrequency`,
// confirmed against `next`'s own type declarations) rather than the
// `lastmod`/`changefreq` names used here previously, which silently never
// matched: TypeScript's structural typing let the mismatched object shape
// through the `as MetadataRoute.Sitemap` cast below without error, so no page
// (pages, posts, or now videos) has ever actually rendered a <lastmod> in the
// generated sitemap.xml — confirmed live while wiring up video entries.
type IObject = {
	url: string;
	changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
	lastModified: string;
	priority: number;
	// hreflang alternates for every supported locale + x-default, built via
	// `buildLocaleAlternates` — one sitemap entry per English slug carrying
	// every locale's URL, rather than emitting `locales.length`x flat entries
	// per page/post/video. Translated variants reuse the English source's own
	// `lastModified` (they're derived, not independently edited).
	alternates: { languages: Record<string, string> };
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Sitemap XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Generates the sitemap for the application by fetching all necessary slugs from the
 * CMS and constructing the sitemap entries.
 *
 * @returns The full `MetadataRoute.Sitemap` entry list for the site.
 */
const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
	const [pagesSlugs, postsSlugs] = await Promise.all([
		getAllPagesSlugs(),
		getAllPostsSlugs(),
	]) as [IKeys[] | undefined, IKeys[] | undefined];

	// getAllQualifyingVideoSummaries throws (missing env vars, or a genuine API
	// failure) rather than resolving to undefined like the two CMS calls above —
	// YouTube isn't configured on every fork, and a client without it shouldn't
	// lose pages/posts out of the sitemap over it. Only regular (>60s) uploads
	// are included: Shorts don't have their own single-page route yet, so
	// there's nothing to link a sitemap entry to.
	let videoSummaries: IVideoKeys[] = [];

	try {
		videoSummaries = await getAllQualifyingVideoSummaries({ minDurationSeconds: 60 });
	} catch (error) {
		console.log(error);
	}

	/* PUSHING THE DYNAMIC SLUGS INTO THE EMPTY ARRAYS */
	/* Pages, News Insights Posts, Videos Arrays */
	const pagesLinks: IObject[] = [];
	const postsLinks: IObject[] = [];
	const videosLinks: IObject[] = [];

	/* PAGES */
	// getAllPagesSlugs/getAllPostsSlugs both resolve to undefined on a CMS failure —
	// falling back to [] here keeps a failure on one source from taking down the
	// other's links (and the whole sitemap) along with it.
	(pagesSlugs ?? []).map((keys: IKeys) => {

		const { canonical, languages } = buildLocaleAlternates(defaultLocale, `/${keys.slug}`);

		const object: IObject = {
			url: canonical,
			changeFrequency: "monthly",
			lastModified: `${keys.modified}`,
			priority: 0.8,
			alternates: { languages },
		};

		pagesLinks.push(object);
	});

	/* POSTS */
	(postsSlugs ?? []).map((keys: IKeys) => {

		const { canonical, languages } = buildLocaleAlternates(defaultLocale, `/posts/${keys.slug}`);

		const object: IObject = {
			url: canonical,
			changeFrequency: "weekly",
			lastModified: `${keys.modified}`,
			priority: 0.6,
			alternates: { languages },
		};

		postsLinks.push(object);
	});

	/* VIDEOS */
	// `/videos/{titleSlug}-{videoId}` — matches the actual
	// app/[locale]/videos/[slug]/page.tsx route param shape (`buildVideoSlug`).
	videoSummaries.map((keys: IVideoKeys) => {

		const { canonical, languages } = buildLocaleAlternates(defaultLocale, `/videos/${buildVideoSlug(keys.title, keys.videoId)}`);

		const object: IObject = {
			url: canonical,
			changeFrequency: "monthly",
			lastModified: `${keys.publishedAt}`,
			priority: 0.5,
			alternates: { languages },
		};

		videosLinks.push(object);
	});

	// Arrays with your all dynamic links
	const allLinks: MetadataRoute.Sitemap = [...pagesLinks, ...postsLinks, ...videosLinks];

	return allLinks as MetadataRoute.Sitemap;
};

export default sitemap;
