/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC } from "react";
import * as IYoutubeVideoGrid from "@/components/CMS/YouTubeVideoGrid/types/youtubeVideoGrid";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/YouTubeVideoGrid/styles/YouTubeVideoGrid.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */


/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX YoutubeVideoGrid Component XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * YouTubeVideoGrid CMS block — not yet implemented. Registered in
 * DynamicComponentLoaders and receives CMS props via IProps, but still renders
 * only a styled, otherwise-empty div — this block's real design/purpose is
 * undecided (it isn't yet distinct from `AllYoutubeVideos`), so nothing beyond
 * the div is invented here.
 *
 * The one change from a fully bare stub: the ACF `title` field now renders as
 * a plain heading when set, same as `AllBlogPosts`/`AllYoutubeVideos` — no
 * eyebrow label, since this block has no defined identity to label yet.
 * @param title The ACF `title` field, rendered as-is if present.
 */
const YoutubeVideoGrid: FC<IYoutubeVideoGrid.IProps> = ({ title }) => {

	return (
		<div className={styles.youtubeVideoGrid}>
			{title && <h2 className={styles.youtubeVideoGridHeading}>{title}</h2>}
		</div>
	);
};

YoutubeVideoGrid.displayName = 'YoutubeVideoGrid';

export default YoutubeVideoGrid;
