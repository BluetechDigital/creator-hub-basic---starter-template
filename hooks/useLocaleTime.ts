"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { useEffect, useState } from "react";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXX Hook to get current time in London locale XXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Returns the current time formatted for the `Europe/London` timezone, updated every
 * second via `setInterval`. The timezone is hardcoded (not derived from the viewer's
 * locale or any config), so this is only correct for a London-based display.
 *
 * Returns `""` on the initial render (before the first interval tick has fired), which
 * means the first client render intentionally differs from what will be shown a moment
 * later — a hydration-mismatch-shaped pattern worth being aware of if this value is ever
 * rendered during SSR.
 *
 * @returns The current London time as a formatted 12-hour string (e.g. "3:45 PM"), or
 * `""` before the first tick.
 */
const useLocaleTime = (): string => {
	const [time, setTime] = useState("");

	useEffect(() => {
		// Update the time every second
		const interval = setInterval(() => {
			const londonTime = new Date().toLocaleTimeString("en-US", {
				timeZone: "Europe/London",
				hour: "2-digit",
				minute: "2-digit",
				hour12: true, // Ensures 12-hour format with AM/PM
			});
			setTime(londonTime);
		}, 1000);

		// Clear the interval on component unmount
		return () => clearInterval(interval);
	}, []);

	return time;
};

useLocaleTime.displayName = 'useLocaleTime';

export default useLocaleTime;
