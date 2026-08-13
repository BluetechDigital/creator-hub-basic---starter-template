"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC } from "react";
import { motion } from "framer-motion";
import { initialTwo, fadeIn } from "@/animations/animations";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXX Interface for hook parameters XXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IFormatNumber = {
	number: string;
	decimals: number;
	className: string;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXX Hook to format numbers into short form (e.g., 613k) XXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Formats a numeric string into short form (e.g., 613000 -> "613k") and renders it
 * inside an animated `<motion.h4>` that fades/slides in when scrolled into view.
 *
 * Despite the `use` prefix (kept for naming consistency with the other hooks in this
 * folder), this is not a plain value-returning hook — it returns JSX directly, so it
 * must be used like a component (e.g. `<UseFormatNumber ... />`), not destructured
 * like a hook's return value.
 *
 * @param number - The raw number, passed as a string, to format.
 * @param decimals - Number of decimal places to keep after formatting (default 0).
 * @param className - Class name applied to the rendered `<motion.h4>`.
 * @returns A `<motion.h4>` element containing the formatted number.
 */
const useFormatNumber: FC<IFormatNumber> = ({
	number,
	decimals = 0,
	className,
}) => {
	// Formatting function to convert numbers to short form (e.g., 613k)
	const formatNumber = (num: number): string => {
		if (num >= 1000000) {
			return (num / 1000000).toFixed(decimals) + "M";
		} else if (num >= 1000) {
			return (num / 1000).toFixed(decimals) + "k";
		}
		return num.toString();
	};

	// Ensure `number` is treated as a number type
	const formattedNumber = formatNumber(parseFloat(number.toString()));

	return (
		<motion.h4
			initial={initialTwo}
			whileInView={fadeIn}
			viewport={{once: true}}
			className={className}
		>
			{formattedNumber}
		</motion.h4>
	);
};

useFormatNumber.displayName = 'useFormatNumber';

export default useFormatNumber;
