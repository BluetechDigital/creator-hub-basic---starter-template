/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, memo } from "react";
import * as IYoutubeVideoGrid from "@/components/CMS/YoutubeVideoGrid/types/youtubeVideoGrid";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/YoutubeVideoGrid/styles/YoutubeVideoGrid.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */


/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX YoutubeVideoGrid Component XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const YoutubeVideoGrid: FC<IYoutubeVideoGrid.IProps> = memo(({}) => {

	return (
		<div className={styles.youtubeVideoGrid}>
		</div>
	);
});

YoutubeVideoGrid.displayName = 'YoutubeVideoGrid';

export default YoutubeVideoGrid;
