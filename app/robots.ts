/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { MetadataRoute } from "next";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const SITE_URL: string | undefined = process.env.SITE_URL;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Robots Metadata XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const robots = async () => {

	const metaRobots: MetadataRoute.Robots = {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: "/private/",
		},
		sitemap: `${SITE_URL}/sitemap.xml`,
	};
	return metaRobots;
};

export default robots;
