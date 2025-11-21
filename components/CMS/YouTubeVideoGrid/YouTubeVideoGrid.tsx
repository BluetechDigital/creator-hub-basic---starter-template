/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, memo } from "react";
import * as IYouTubeVideoGrid from "@/components/CMS/YouTubeVideoGrid/types/youTubeVideoGrid";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/YouTubeVideoGrid/styles/YouTubeVideoGrid.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */


/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX YouTubeVideoGrid Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const YouTubeVideoGrid: FC<IYouTubeVideoGrid.IProps> = memo(({}) => {

	return (
		<div className={styles.youTubeVideoGrid}>
		</div>
	);
});

YouTubeVideoGrid.displayName = 'YouTubeVideoGrid';

export default YouTubeVideoGrid;
