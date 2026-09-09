/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IInstagramFeed from "@/components/CMS/InstagramFeed/types/instagramFeed";
import { getLocale } from "@/i18n/getLocale";
import { getDictionary } from "@/i18n/dictionaries";
import { getAllInstagramFeedContent } from "@/api/Instagram/GetAllInstagramFeedContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/InstagramFeed/styles/InstagramFeed.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import Title from "@/components/Global/Elements/Title";
import InstagramGrid from "@/components/CMS/InstagramFeed/fragments/InstagramGrid";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX InstagramFeed Component XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * A title over the account's recent Instagram posts — `InstagramGrid` shows the
 * first 9 and reveals the rest of the fetched batch behind a "Show more" button.
 * Async Server Component — the feed is fetched in the component body via
 * `api/Instagram`, so a missing token / API blip degrades to an empty state
 * (handled inside `InstagramGrid`) rather than crashing the page. `title` is
 * machine-translated upstream (`RenderFlexibleContent` `PROSE_FIELDS`); the
 * fixed labels come from the current locale's static dictionary
 * (`i18n/dictionaries`) — this component is a Server Component so it can read
 * `getDictionary()` directly, then hands the relevant slice down to the two
 * Client Component fragments as a `labels` prop.
 */
const InstagramFeed = async ({ title }: IInstagramFeed.IProps) => {
	let feed: Awaited<ReturnType<typeof getAllInstagramFeedContent>> = [];

	try {
		feed = await getAllInstagramFeedContent();
	} catch (error) {
		console.log(error);
	}

	const locale = await getLocale();
	const dict = await getDictionary(locale);

	const labels = {
		showMore: dict.common.showMore,
		...dict.instagramFeed,
	};

	return (
		<div className={styles.instagramFeed}>
			<Title content={`${title ?? ""}`} className={styles.instagramFeedTitle} />

			<div className={styles.instagramFeedContainer}>
				<InstagramGrid posts={feed} labels={labels} />
			</div>
		</div>
	);
};

InstagramFeed.displayName = 'InstagramFeed';

export default InstagramFeed;
