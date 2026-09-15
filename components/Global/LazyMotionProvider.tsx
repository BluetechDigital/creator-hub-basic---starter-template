"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, ReactNode } from "react";
import { LazyMotion } from "framer-motion";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXX Lazy feature-bundle loader XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// A function reference, not the awaited module — LazyMotion calls this itself
// once, on mount, rather than the feature bundle being part of this file's own
// (eagerly-loaded) chunk. See lazyMotionFeatures.ts's own doc comment for why
// that file has to stay a separate, never-statically-imported module.
const loadFeatures = () => import("@/components/Global/lazyMotionFeatures").then((mod) => mod.default);

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXX LazyMotionProvider Component XXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Wraps the whole app (rendered around every child of `<body>` in
 * `app/[locale]/layout.tsx`) so every `<motion.X>` component in the codebase
 * — animated headings, the cookie-consent banner, the locale switcher's
 * dropdown, scroll-reveal wrappers, all of it — could be converted to
 * `<m.X>`, letting Framer Motion ship only the specific feature bundle this
 * app actually uses (`lazyMotionFeatures.ts`) instead of the whole library's
 * drag/full-layout-animation/gesture surface, most of which this app never
 * touches.
 *
 * `strict` throws at runtime if any descendant ever renders `motion.*`
 * instead of `m.*` — kept on permanently as a regression tripwire, not just
 * for the initial conversion: confirmed live with an exhaustive repo-wide
 * grep that zero `motion.*` usages remain before this was ever enabled, so
 * it should never actually fire against today's code; it exists to catch a
 * *future* `import { motion }` creeping back in, loudly, in dev, rather than
 * silently reintroducing the bundle-size regression this exists to prevent.
 * @param children The app content to render inside the lazy-loaded feature
 * boundary — effectively everything, since any component anywhere could be
 * the one that animates.
 */
const LazyMotionProvider: FC<{ children: ReactNode }> = ({ children }) => {
	return (
		<LazyMotion features={loadFeatures} strict>
			{children}
		</LazyMotion>
	);
};

LazyMotionProvider.displayName = "LazyMotionProvider";

export default LazyMotionProvider;
