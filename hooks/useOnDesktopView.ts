"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { useEffect, useState } from "react";

/* -----------------------------------------------------------------------------
XXXXXX Hook to determine if the view is desktop based on window width XXXXXXXXXXX
----------------------------------------------------------------------------- */

const useOnDesktopView = (): boolean => {
	// State to track window width and check if on desktop
	const [onDesktop, setOnDesktop] = useState(false);

	// Update windowSize and onDesktop when the component mounts
	useEffect(() => {
		const handleResize = () => {
			const size = window.innerWidth;
			setOnDesktop(size > 1024);
		};

		// Call handleResize initially and add event listener for resize events
		handleResize();
		window.addEventListener("resize", handleResize);

		// Cleanup resize listener
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return onDesktop;
};

useOnDesktopView.displayName = 'useOnDesktopView';

export default useOnDesktopView;
