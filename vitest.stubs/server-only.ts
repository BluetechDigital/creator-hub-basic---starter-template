// Test-only stand-in for the real `server-only` package (see vitest.config.mts's
// `resolve.alias`). The real package unconditionally throws when imported outside
// Next's own webpack/Turbopack build — it detects "did the framework's bundler
// specially handle this import" and errors otherwise, which is exactly what
// happens under Vitest (a plain Vite/Node environment, not Next's RSC bundler).
// Aliased only for tests; the real package still guards `i18n/dictionaries.ts`
// (and any future server-only module) against being bundled into client code in
// the actual Next.js build.
export {};
