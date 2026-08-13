/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC } from "react";
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

/**
 * InstagramFeed CMS block — not yet implemented. Registered in DynamicComponentLoaders
 * and receives CMS props via IProps, but currently renders only a styled div.
 */
const InstagramFeed: FC<IInstagramFeed.IProps> = ({}) => {

	return (
		<div className={styles.instagramFeed}>
		</div>
	);
};

InstagramFeed.displayName = 'InstagramFeed';

export default InstagramFeed;
