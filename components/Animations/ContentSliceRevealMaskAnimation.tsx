/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, useRef } from "react";
import { motion, useInView, Variants } from "framer-motion";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export type IProps = {
	className?: string;
	children: React.ReactNode;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Mask Animation XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const AnimationProps: Variants = {
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
XXXXXXXXXXXXXXXXX ContentSliceRevealMaskAnimation Component XXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const ContentSliceRevealMaskAnimation: FC<IProps> = ({
	children,
	className,
}) => {
	const body = useRef(null);
	const isInView = useInView(body, {once: false, margin: "-5%"});

	return (
		<div className={className}>
			<div ref={body} className="overflow-hidden">
				<div className="overflow-hidden">
					<motion.div
						initial="initial"
						animate={isInView ? "enter" : ""}
						variants={AnimationProps}
					>
						{children}
					</motion.div>
				</div>
			</div>
		</div>
	);
};

ContentSliceRevealMaskAnimation.displayName = 'ContentSliceRevealMaskAnimation';

export default ContentSliceRevealMaskAnimation;
