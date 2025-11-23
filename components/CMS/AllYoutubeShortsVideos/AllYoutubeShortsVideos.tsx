/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, memo } from "react";
import * as IAllYoutubeShortsVideos from "@/components/CMS/AllYoutubeShortsVideos/types/allYoutubeShortsVideos";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/AllYoutubeShortsVideos/styles/AllYoutubeShortsVideos.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */


/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXX AllYoutubeShortsVideos Component XXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const AllYoutubeShortsVideos: FC<IAllYoutubeShortsVideos.IProps> = memo(({}) => {

	return (
		<div className={styles.allYouTubeShortsVideos}>
		</div>
	);
});

AllYoutubeShortsVideos.displayName = 'AllYoutubeShortsVideos';

export default AllYoutubeShortsVideos;
