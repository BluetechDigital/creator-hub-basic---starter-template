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
