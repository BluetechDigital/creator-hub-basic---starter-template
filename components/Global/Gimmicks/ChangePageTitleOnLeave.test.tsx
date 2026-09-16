import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import ChangePageTitleOnLeave from "./ChangePageTitleOnLeave";

/* -----------------------------------------------------------------------------
This component is mounted once in the root layout and never remounts on a
client-side navigation between pages — its `useEffect` only runs once. These
tests simulate exactly that: the title changes (as it would on a real
navigation to a different page) *without* re-rendering/remounting the
component, then a blur/focus cycle fires.
----------------------------------------------------------------------------- */

afterEach(() => {
	cleanup();
	document.title = "";
});

describe("ChangePageTitleOnLeave", () => {
	it("captures the title fresh at blur time, not the one from initial mount", () => {
		document.title = "Video A | Creator Hub";
		render(<ChangePageTitleOnLeave />);

		// Simulate a client-side navigation to a different page — Next's router
		// updates document.title directly; this component doesn't remount.
		document.title = "Video B | Creator Hub";

		window.dispatchEvent(new Event("blur"));

		expect(document.title).toBe("Come back! We miss you 😢💔 | Video B | Creator Hub");
	});

	it("restores the title that was actually showing when the tab was left, on focus", () => {
		document.title = "Video A | Creator Hub";
		render(<ChangePageTitleOnLeave />);

		document.title = "Video B | Creator Hub";
		window.dispatchEvent(new Event("blur"));
		window.dispatchEvent(new Event("focus"));

		expect(document.title).toBe("Video B | Creator Hub");
	});

	it("doesn't re-wrap the 'Come back!' text on a second blur with no focus in between", () => {
		document.title = "Video B | Creator Hub";
		render(<ChangePageTitleOnLeave />);

		window.dispatchEvent(new Event("blur"));
		window.dispatchEvent(new Event("blur"));

		expect(document.title).toBe("Come back! We miss you 😢💔 | Video B | Creator Hub");

		window.dispatchEvent(new Event("focus"));
		expect(document.title).toBe("Video B | Creator Hub");
	});

	it("restores the real title on unmount if it unmounts mid-swap", () => {
		document.title = "Video B | Creator Hub";
		const { unmount } = render(<ChangePageTitleOnLeave />);

		window.dispatchEvent(new Event("blur"));
		expect(document.title).toBe("Come back! We miss you 😢💔 | Video B | Creator Hub");

		unmount();
		expect(document.title).toBe("Video B | Creator Hub");
	});
});
