/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC } from "react";
import * as ISponsorshipInfo from "@/components/CMS/SponsorshipInfo/types/sponsorshipInfo";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/SponsorshipInfo/styles/SponsorshipInfo.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */


/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXX SponsorshipInfo Component XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * SponsorshipInfo CMS block — not yet implemented. Registered in DynamicComponentLoaders
 * and receives CMS props via IProps, but currently renders only a styled div.
 */
const SponsorshipInfo: FC<ISponsorshipInfo.IProps> = ({}) => {

	return (
		<div className={styles.sponsorshipInfo}>
		</div>
	);
};

SponsorshipInfo.displayName = 'SponsorshipInfo';

export default SponsorshipInfo;
