import { describe, it, expect, afterEach, vi } from "vitest";

const originalEnv = { ...process.env };

const importFreshModule = async () => {
	vi.resetModules();
	return import("./recaptcha");
};

describe("verifyRecaptcha", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("skips verification (returns true) when RECAPTCHA_SECRET_KEY is unset", async () => {
		delete process.env.RECAPTCHA_SECRET_KEY;

		const { verifyRecaptcha } = await importFreshModule();

		expect(await verifyRecaptcha("token")).toBe(true);
	});

	it("returns true when Google's siteverify responds with success", async () => {
		process.env.RECAPTCHA_SECRET_KEY = "secret";
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ success: true }) }));

		const { verifyRecaptcha } = await importFreshModule();

		expect(await verifyRecaptcha("token")).toBe(true);
	});

	it("returns false when Google's siteverify responds without success", async () => {
		process.env.RECAPTCHA_SECRET_KEY = "secret";
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ success: false }) }));

		const { verifyRecaptcha } = await importFreshModule();

		expect(await verifyRecaptcha("token")).toBe(false);
	});
});
