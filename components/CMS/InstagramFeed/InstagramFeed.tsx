/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, memo } from "react";
import * as IInstagramFeed from "@/components/CMS/InstagramFeed/types/instagramFeed";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/InstagramFeed/styles/InstagramFeed.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */


/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX InstagramFeed Component XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const InstagramFeed: FC<IInstagramFeed.IProps> = memo(({}) => {

	return (
		<div className={styles.instagramFeed}>
		</div>
	);
});

InstagramFeed.displayName = 'InstagramFeed';

export default InstagramFeed;
