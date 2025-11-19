"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { useState, useEffect } from "react";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXX Hook to get current window size XXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IUseWindowSize = {
	width: number | undefined;
	height: number | undefined;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXX Hook to get current window size XXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const useWindowSize = () => {
	const [windowSize, setWindowSize] = useState<IUseWindowSize>({
		width: undefined,
		height: undefined,
	});

	useEffect(() => {
		// Ensure that the effect runs only in the client
		if (typeof window !== "undefined") {
			const handleResize = () => {
				setWindowSize({
					width: window.innerWidth,
					height: window.innerHeight,
				});
			};

			// Set initial size
			handleResize();

			// Add event listener
			window.addEventListener("resize", handleResize);

			// Cleanup on unmount
			return () => window.removeEventListener("resize", handleResize);
		}
	}, []);

	return windowSize;
};

useWindowSize.displayName = 'useWindowSize';

export default useWindowSize;
