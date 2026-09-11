import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
	plugins: [react()],
	resolve: {
		tsconfigPaths: true,
		alias: {
			// The real `server-only` package throws unconditionally outside Next's
			// own build (see vitest.stubs/server-only.ts for why) — aliased to a
			// no-op stub for tests only.
			"server-only": path.resolve(import.meta.dirname, "./vitest.stubs/server-only.ts"),
		},
	},
	test: {
		environment: "jsdom",
		setupFiles: ["./vitest.setup.ts"],
		include: ["**/*.test.{ts,tsx}"],
		// `e2e/` is Playwright's — its specs are `*.spec.ts` so the glob above already
		// skips them, but exclude the directory outright so a stray `*.test.ts` helper
		// there never gets pulled into the jsdom unit run.
		exclude: ["node_modules", ".next", "e2e"],
	},
});
