/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * The framer-motion feature bundle `LazyMotionProvider.tsx` loads. Kept in its
 * own file — and never statically imported anywhere else in the app — because
 * that's what actually makes the `import()` in `LazyMotionProvider.tsx` lazy;
 * a static import anywhere would make the bundler ship this eagerly regardless
 * of the dynamic-import wrapper around it.
 *
 * `domAnimation` (not `domMax`) — confirmed live with a full-repo search: this
 * app uses no `drag` prop and no `layout`/`layoutId` prop anywhere, so the
 * larger `domMax` bundle (which adds drag and full layout-animation support)
 * would only add dead weight. `domAnimation` still covers everything this app
 * actually uses: viewport-triggered animations (`whileInView`), gestures, and
 * `AnimatePresence` exit animations (`LocaleSwitcher.tsx`'s dropdown). If a
 * future component needs `drag`/`layout`, switch this single export — not a
 * per-component decision — and re-check the same grep first.
 */
export { domAnimation as default } from "framer-motion";
