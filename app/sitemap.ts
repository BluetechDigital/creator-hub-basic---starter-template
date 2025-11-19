/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { MetadataRoute } from "next";

// Pages
import { getAllPagesSlugs } from "@/graphql/CMS/GetAllPagesSlugs";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const SITE_URL: string | undefined = process.env.SITE_URL;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/* Generates the sitemap for the application by fetching all necessary slugs from
 the CMS and constructing the sitemap entries.  */

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

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
	const siteUrl: string | undefined = SITE_URL;

	const [pagesSlugs] = await Promise.all([getAllPagesSlugs()]) as [IKeys[]];

	/* PUSHING THE DYNAMIC SLUGS INTO THE EMPTY ARRAYS */
	/* Pages, News Insights Posts Arrays */
	const pagesLinks: IObject[] = [];

	/* PAGES */
	pagesSlugs.map((keys: IKeys) => {

		const object: IObject = {
			url: `${siteUrl}/${keys.slug}`,
			changefreq: "monthly",
			lastmod: `${keys.modified}`,
			priority: 0.8,
		};

		pagesLinks.push(object);
	});

	// Arrays with your all dynamic links
	const allLinks: MetadataRoute.Sitemap = [...pagesLinks,];

	return allLinks as MetadataRoute.Sitemap;
};

export default sitemap;
