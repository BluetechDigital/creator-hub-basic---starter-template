"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { useEffect, useState } from "react";

/* -----------------------------------------------------------------------------
XXXXXX Hook to determine if the view is desktop based on window width XXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Tracks whether the viewport is currently wider than the desktop breakpoint, updating
 * on window resize.
 *
 * The `1024`px threshold below is a magic number defined only here — it is not tied to
 * any shared design-token/breakpoint constant elsewhere in the codebase, so if the
 * design system's desktop breakpoint ever changes, this must be updated separately.
 *
 * @returns `true` when `window.innerWidth` is greater than 1024px, otherwise `false`.
 */
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
