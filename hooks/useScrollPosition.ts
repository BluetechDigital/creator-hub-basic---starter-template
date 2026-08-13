"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { useEffect, useState } from "react";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXX Hook to get current scroll position XXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Tracks the current vertical scroll position of the window.
 *
 * @returns The current `window.scrollY` value in pixels, updated on every scroll event.
 */
const useScrollPosition = (): number => {
	// Background color scroll position change
	const [scrollPosition, setScrollPosition] = useState(0);

	useEffect(() => {
		const handleScroll = () => {
			const currentPosition = window.scrollY;
			setScrollPosition(currentPosition);
		};

		window.addEventListener("scroll", handleScroll);

		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	return scrollPosition;
};

useScrollPosition.displayName = 'useScrollPosition';

export default useScrollPosition;
