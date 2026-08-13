/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IAnimation from "@/animations/types/index";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX FRAMER-MOTION ANIMATIONS XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/* 
Custom reusable Animation Properties/variables

This is the default framer-motion scrollYProgress content reveal.
 Provides When in view should the content be revealed */
// offsetStart/offsetFinish are scroll-trigger fractions (of scrollYProgress, 0–1) used to
// gate when scroll-linked reveal animations start/finish — e.g. reveal begins once scroll
// progress passes 0.9 and completes by 0.5, depending on how each consumer applies them.
export const offsetStart: number = 0.9;
export const offsetFinish: number = 0.5;

export const initial: IAnimation.IInitial = {
	y: 0,
	opacity: 0,
};
// Note: initialTwo has the same shape/values as `initial` above — a near-duplicate under
// a different name and type (IInitialTwo). Kept as a separate export; the reason two
// names exist isn't stated elsewhere in the codebase.
export const initialTwo: IAnimation.IInitialTwo = {
	y: 0,
	opacity: 0,
};
export const initialThree: IAnimation.IInitial = {
	y: 90,
	opacity: 0,
};
export const fadeIn: IAnimation.IFadeIn = {
	opacity: 1,
	transition: {
		delay: 0.5,
		duration: 0.75,
		ease: [0, 0, 0.2, 1],
	},
};
export const fadeInTwo: IAnimation.IFadeInTwo = {
	y: 0,
	opacity: 1,
	transition: {
		duration: 1,
		delay: 0.5,
		ease: [0.42, 0, 0.58, 1],
	},
};
export const fadeInUp: IAnimation.IFadeInUp = {
	y: 0,
	opacity: 1,
	transition: {
		delay: 0.5,
		duration: 0.5,
		ease: [0.42, 0, 0.58, 1],
	},
};
export const stagger: IAnimation.IStagger = {
	initial: {
		opacity: 0,
		y: 0,
	},
	animate: {
		opacity: 1,
		y: 0,
		transition: {
			delay: 0.1,
			duration: 0.75,
			ease: [0.42, 0, 0.58, 1],
		},
	},
};
export const arrayLoopStaggerChildren: IAnimation.IArrayLoopStaggerChildren = {
	initial: {
		opacity: 0,
		y: 0,
	},
	animate: (keys: number) => ({
		opacity: 1,
		y: 0,
		transition: {
			delay: 0.1 * keys,
			duration: 0.75,
			ease: [0.42, 0, 0.58, 1],
		},
	}),
};
export const navigationMenuStaggerChildren: IAnimation.IArrayLoopStaggerChildren = {
	initial: {
		opacity: 0,
		y: 0,
	},
	animate: (keys: number) => ({
		opacity: 1,
		y: 0,
		transition: {
			delay: 0.25 * keys,
			duration: 0.5,
			ease: [0.42, 0, 0.58, 1],
		},
	}),
};

// Slide In Direction (Horizontal)
export const slideInRightInitial: IAnimation.ISlideInRightInitial = {
	y: 0,
	x: 200,
	opacity: 0,
};
export const slideInLeftInitial: IAnimation.ISlideInLeftInitial = {
	y: 0,
	x: -200,
	opacity: 0,
};
export const slideInRightFinish: IAnimation.ISlideInRightFinish = {
	y: 0,
	x: 0,
	opacity: 1,
	transition: {
		delay: 0.5,
		duration: 0.75,
		ease: [0.42, 0, 0.58, 1],
		staggerChildren: 0.1,
	},
};

export default fadeInUp;