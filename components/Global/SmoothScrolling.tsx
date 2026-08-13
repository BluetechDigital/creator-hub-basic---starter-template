"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC } from "react";
import { ReactLenis } from "lenis/react";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type ISmoothScrolling = {
	children: React.ReactNode;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXX Lenis Smooth Scrolling Component XXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Wraps the app in Lenis smooth scrolling (`ReactLenis`, root mode) so scroll input
 * across the whole page is eased rather than jumping instantly.
 */
const SmoothScrolling: FC<ISmoothScrolling> = ({children}) => {
	return (
		<ReactLenis
			root
			options={{
				// Learn more -> https://github.com/darkroomengineering/lenis?tab=readme-ov-file#instance-settings
				lerp: 0.05,
				//   infinite: true,
				//   syncTouch: true,
			}}
		>
			{children}
		</ReactLenis>
	);
};

SmoothScrolling.displayName = 'SmoothScrolling';

export default SmoothScrolling;
