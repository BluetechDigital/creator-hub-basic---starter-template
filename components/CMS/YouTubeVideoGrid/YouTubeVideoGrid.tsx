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

const YoutubeVideoGrid: FC<IYoutubeVideoGrid.IProps> = ({}) => {

	return (
		<div className={styles.youtubeVideoGrid}>
		</div>
	);
};

YoutubeVideoGrid.displayName = 'YoutubeVideoGrid';

export default YoutubeVideoGrid;
