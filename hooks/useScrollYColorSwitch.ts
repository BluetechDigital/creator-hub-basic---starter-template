"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { MotionValue } from "framer-motion";
import {useState, useEffect} from "react";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXX Interface for hook parameters XXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IUseScrollYColorSwitch = {
	containerRef: React.RefObject<HTMLDivElement>;
	scrollYProgress: MotionValue<number>;
	colorBefore: string;
	colorAfter: string;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXX Hook to switch color based on scroll position XXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Switches between two colors depending on whether scroll progress has passed a
 * halfway point computed from a container element's position.
 *
 * @param containerRef - Ref to the element whose position/height define the halfway point.
 * @param scrollYProgress - Framer-motion scroll progress value that triggers re-evaluation on change.
 * @param colorBefore - Color returned before the halfway point is reached.
 * @param colorAfter - Color returned once the halfway point is reached.
 * @returns The currently active color string.
 */
const useScrollYColorSwitch = ({
	scrollYProgress,
	colorAfter,
	colorBefore,
	containerRef,
}: IUseScrollYColorSwitch): string => {
	const [color, setColor] = useState(colorBefore);

	useEffect(() => {
		const updateColor = () => {
			if (containerRef.current) {
				const containerOffsetTop = containerRef.current.offsetTop;
				const containerHeight = containerRef.current.offsetHeight;
				/* Slightly before 50% or Halfway Point ( divide by / 2)
				 would be Halfway Point of the selected element / div */
				const halfwayPoint = containerOffsetTop + containerHeight / 2.25;

				// FLAG (not fixed here): scrollYProgress is a framer-motion MotionValue in the
				// 0–1 range, but halfwayPoint is computed from pixel offsets
				// (containerOffsetTop/containerHeight) — comparing a 0–1 value against a pixel
				// value looks like a unit mismatch bug. Left as-is pending review; see
				// [related follow-up].
				setColor(
					scrollYProgress.get() >= halfwayPoint ? colorAfter : colorBefore
				);
			}
		};

		const unsubscribe = scrollYProgress.onChange(updateColor);

		return () => unsubscribe();
	}, [containerRef, scrollYProgress, colorBefore, colorAfter]);

	return color;
};

useScrollYColorSwitch.displayName = 'useScrollYColorSwitch';

export default useScrollYColorSwitch;
