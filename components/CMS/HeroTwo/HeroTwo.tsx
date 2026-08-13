/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC } from "react";
import * as IHeroTwo from "@/components/CMS/HeroTwo/types/heroTwo";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/HeroTwo/styles/HeroTwo.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX HeroTwo Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * HeroTwo CMS block — not yet implemented. Registered in DynamicComponentLoaders
 * and receives CMS props via IProps, but currently renders only a styled div.
 */
const HeroTwo: FC<IHeroTwo.IProps> = ({}) => {

	return (
		<div className={styles.heroTwo}>
		</div>
	);
};

HeroTwo.displayName = 'HeroTwo';

export default HeroTwo;
