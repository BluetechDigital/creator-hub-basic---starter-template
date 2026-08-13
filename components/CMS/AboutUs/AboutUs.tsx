/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC } from "react";
import * as IAboutUs from "@/components/CMS/AboutUs/types/aboutUs";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/AboutUs/styles/AboutUs.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */


/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX AboutUs Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * AboutUs CMS block — not yet implemented. Registered in DynamicComponentLoaders
 * and receives CMS props via IProps, but currently renders only a styled div.
 */
const AboutUs: FC<IAboutUs.IProps> = ({}) => {

	return (
		<div className={styles.aboutUs}>
		</div>
	);
};

AboutUs.displayName = 'AboutUs';

export default AboutUs;
