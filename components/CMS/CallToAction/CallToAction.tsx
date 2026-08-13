/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC } from "react";
import * as ICallToAction from "@/components/CMS/CallToAction/types/callToAction";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/CallToAction/styles/CallToAction.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */


/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX CallToAction Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * CallToAction CMS block — not yet implemented. Registered in DynamicComponentLoaders
 * and receives CMS props via IProps, but currently renders only a styled div.
 */
const CallToAction: FC<ICallToAction.IProps> = ({}) => {

	return (
		<div className={styles.callToAction}>
		</div>
	);
};

CallToAction.displayName = 'CallToAction';

export default CallToAction;
