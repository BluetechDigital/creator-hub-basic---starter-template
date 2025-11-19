/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, useRef } from "react";
import { motion, useScroll } from "framer-motion";
import { fadeIn, offsetFinish, offsetStart } from "@/animations/animations";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IProps = {
	style?: unknown;
	className?: string;
	children: React.ReactNode;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXX ScrollYProgressReveal Component XXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const ScrollYProgressReveal: FC<IProps> = ({children, className}) => {
	const container = useRef(null);

	const {scrollYProgress} = useScroll({
		target: container,
		offset: [`start ${offsetStart}`, `start ${offsetFinish}`],
	});
	return (
		<motion.div
			ref={container}
			style={{opacity: fadeIn ? scrollYProgress : 1}}
			className={children ? ` ${className}` : `hidden`}
		>
			{children}
		</motion.div>
	);
};

ScrollYProgressReveal.displayName = 'ScrollYProgressReveal';

export default ScrollYProgressReveal;
