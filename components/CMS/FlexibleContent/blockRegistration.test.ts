import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX Consistency check, not a scope gate XXXXXXXXXXXXXXXXXXX
This only catches accidental drift between components/CMS/ and
DynamicComponentLoaders (e.g. the YoutubeVideoGrid casing bug this repo shipped
with) — a folder with no registration, or a registration pointing at a path that
no longer exists. It does NOT stop someone from deliberately adding a bespoke,
client-specific block and registering it correctly; that's a review-process
problem, not something a consistency test can catch. See ARCHITECTURE.md.
----------------------------------------------------------------------------- */

const CMS_DIR = path.resolve(process.cwd(), "components/CMS");
const RENDERER_PATH = path.resolve(CMS_DIR, "FlexibleContent/RenderFlexibleContent.tsx");

const getBlockFolderNames = (): string[] => {
	return fs
		.readdirSync(CMS_DIR, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.filter((name) => fs.existsSync(path.join(CMS_DIR, name, `${name}.tsx`)));
};

const getRegisteredComponents = (): { key: string; importPath: string }[] => {
	const source = fs.readFileSync(RENDERER_PATH, "utf-8");
	const registrationRegex = /(\w+):\s*\(\)\s*=>\s*import\("([^"]+)"\)/g;

	const registered: { key: string; importPath: string }[] = [];
	let match: RegExpExecArray | null;

	while ((match = registrationRegex.exec(source)) !== null) {
		registered.push({ key: match[1], importPath: match[2] });
	}

	return registered;
};

describe("CMS block registration (components/CMS <-> DynamicComponentLoaders)", () => {
	it("registers every block folder that exists under components/CMS", () => {
		const blockFolders = getBlockFolderNames();
		const registered = getRegisteredComponents();
		const registeredFolderNames = registered.map(({ importPath }) => importPath.split("/").pop());

		for (const folder of blockFolders) {
			expect(
				registeredFolderNames,
				`"${folder}" has a components/CMS/${folder}/${folder}.tsx file but is not registered in DynamicComponentLoaders — it will never render on a page.`,
			).toContain(folder);
		}
	});

	it("only registers components whose import path still exists on disk", () => {
		const registered = getRegisteredComponents();

		for (const { key, importPath } of registered) {
			const resolved = path.resolve(process.cwd(), `${importPath.replace(/^@\//, "")}.tsx`);

			expect(
				fs.existsSync(resolved),
				`DynamicComponentLoaders["${key}"] imports "${importPath}", which does not exist on disk.`,
			).toBe(true);
		}
	});
});
