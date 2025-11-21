/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, memo } from "react";
import * as ICallToActionTwo from "@/components/CMS/CallToActionTwo/types/callToActionTwo";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/CallToActionTwo/styles/CallToActionTwo.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */


/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXX CallToActionTwo Component XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const CallToActionTwo: FC<ICallToActionTwo.IProps> = memo(({}) => {

	return (
		<div className={styles.callToActionTwo}>
		</div>
	);
});

CallToActionTwo.displayName = 'CallToActionTwo';

export default CallToActionTwo;
