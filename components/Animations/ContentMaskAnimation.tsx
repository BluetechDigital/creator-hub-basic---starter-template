/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, useRef } from "react";
import { motion, useInView, Variants } from "framer-motion";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IContentMaskAnimation = {
	children: React.ReactNode;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Mask Animation XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const TextSlicedSlantMaskAnimation: Variants = {
	initial: {
		y: "100%",
	},
	enter: (i: number) => ({
		y: "0", // Move into view
		transition: {
			duration: 1,
			ease: [0.5, 0.5, 0.75, 1],
			delay: 0.05 * i,
		},
	}),
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXX ContentMaskAnimation Component XXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const ContentMaskAnimation: FC<IContentMaskAnimation> = ({children}) => {
	const body = useRef(null);
	const isInView = useInView(body, {once: false, margin: "-5%"});

	return (
		<div ref={body} className="overflow-hidden">
			<motion.div
				initial="initial"
				animate={isInView ? "enter" : ""}
				variants={TextSlicedSlantMaskAnimation}
			>
				{children}
			</motion.div>
		</div>
	);
};

ContentMaskAnimation.displayName = 'ContentMaskAnimation';

export default ContentMaskAnimation;
