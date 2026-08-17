/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { MetadataRoute } from "next";

// Pages
import { getAllPagesSlugs } from "@/graphql/CMS/GetAllPagesSlugs";

// Posts
import { getAllPostsSlugs } from "@/graphql/CMS/GetAllPostsSlugs";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const SITE_URL: string | undefined = process.env.SITE_URL;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

//  Define types for slug data and sitemap entries
type IKeys = {
	slug: string;
	modified: string;
};

// Define the structure of sitemap entry objects
type IObject = {
	url: string;
	changefreq: string;
	lastmod: string;
	priority: number;
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
	const siteUrl: string | undefined = SITE_URL;

	const [pagesSlugs, postsSlugs] = await Promise.all([
		getAllPagesSlugs(),
		getAllPostsSlugs(),
	]) as [IKeys[] | undefined, IKeys[] | undefined];

	/* PUSHING THE DYNAMIC SLUGS INTO THE EMPTY ARRAYS */
	/* Pages, News Insights Posts Arrays */
	const pagesLinks: IObject[] = [];
	const postsLinks: IObject[] = [];

	/* PAGES */
	// getAllPagesSlugs/getAllPostsSlugs both resolve to undefined on a CMS failure —
	// falling back to [] here keeps a failure on one source from taking down the
	// other's links (and the whole sitemap) along with it.
	(pagesSlugs ?? []).map((keys: IKeys) => {

		const object: IObject = {
			url: `${siteUrl}/${keys.slug}`,
			changefreq: "monthly",
			lastmod: `${keys.modified}`,
			priority: 0.8,
		};

		pagesLinks.push(object);
	});

	/* POSTS */
	(postsSlugs ?? []).map((keys: IKeys) => {

		const object: IObject = {
			url: `${siteUrl}/posts/${keys.slug}`,
			changefreq: "weekly",
			lastmod: `${keys.modified}`,
			priority: 0.6,
		};

		postsLinks.push(object);
	});

	// Arrays with your all dynamic links
	const allLinks: MetadataRoute.Sitemap = [...pagesLinks, ...postsLinks];

	return allLinks as MetadataRoute.Sitemap;
};

export default sitemap;
