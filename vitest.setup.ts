import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Not running with vitest's `globals: true`, so Testing Library's own
// auto-cleanup (which only self-registers when it finds a global `afterEach`)
// never kicks in. Without this, every render() in a test file leaks into the
// same document.body and screen.getByText(...) starts matching multiple
// elements across unrelated tests.
afterEach(() => {
	cleanup();
});

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXX Browser API polyfills for jsdom XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// framer-motion (used across most CMS blocks via ScrollYProgressReveal, Paragraph,
// etc.) relies on ResizeObserver/IntersectionObserver/matchMedia for scroll- and
// viewport-tracking hooks (useScroll, whileInView). jsdom doesn't implement any of
// these, so every component that renders motion.* elements needs them stubbed —
// this is shared setup, not specific to any one test.

class ObserverStub {
	observe(): void {}
	unobserve(): void {}
	disconnect(): void {}
}

if (typeof window !== "undefined") {
	window.ResizeObserver ??= ObserverStub as unknown as typeof ResizeObserver;
	window.IntersectionObserver ??= ObserverStub as unknown as typeof IntersectionObserver;

	window.matchMedia ??= (query: string): MediaQueryList => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false,
	} as MediaQueryList);
}
