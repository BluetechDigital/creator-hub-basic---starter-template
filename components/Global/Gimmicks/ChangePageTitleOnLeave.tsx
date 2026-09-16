"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { useEffect, useRef } from "react";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXX Change Page Title On Leave Component XXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Swaps the browser tab's title to a "come back" message while the visitor
 * is on a different tab/window, restoring it the moment they return. Mounted
 * once in the root layout (`app/[locale]/layout.tsx`), not per-page — the App
 * Router never remounts it on a client-side navigation between pages, only
 * on a full reload.
 *
 * That's why the title to restore on focus is captured fresh at the moment
 * of each `blur`, not once in a `useEffect` that runs on mount: capturing it
 * once would freeze it at whatever page happened to be loaded when this
 * component first mounted (e.g. the very first page of the visit) — every
 * later blur/focus cycle, on any other page, would then swap in and restore
 * that same stale title instead of the page actually being viewed. Confirmed
 * live: this is exactly why a single video page's browser tab was reverting
 * to the videos *archive* page's title (or whichever page loaded first)
 * after a blur/focus cycle, never the individual video's own title.
 */
const ChangePageTitleOnLeave = () => {
	const titleBeforeBlur = useRef<string | null>(null);

	useEffect(() => {
		const handleBlur = () => {
			// Only swap once — a second `blur` while already "away" (e.g. the
			// window losing focus again before it's ever regained it) must not
			// re-capture the already-swapped "Come back!" text as if it were
			// the real page title.
			if (titleBeforeBlur.current !== null) return;

			titleBeforeBlur.current = document.title;
			document.title = `Come back! We miss you 😢💔 | ${document.title}`;
		};

		const handleFocus = () => {
			if (titleBeforeBlur.current === null) return;

			document.title = titleBeforeBlur.current;
			titleBeforeBlur.current = null;
		};

		window.addEventListener("focus", handleFocus);
		window.addEventListener("blur", handleBlur);

		return () => {
			window.removeEventListener("focus", handleFocus);
			window.removeEventListener("blur", handleBlur);
			// If unmounting while still mid-swap (a blur with no matching focus
			// yet — e.g. this ever became a per-page component instead of a
			// root-layout one), restore the real title rather than leaving
			// "Come back!" showing after the component is gone.
			if (titleBeforeBlur.current !== null) {
				document.title = titleBeforeBlur.current;
			}
		};
	}, []);

	// This component doesn't need to render any UI
	return null;
};

ChangePageTitleOnLeave.displayName = 'ChangePageTitleOnLeave';

export default ChangePageTitleOnLeave;
