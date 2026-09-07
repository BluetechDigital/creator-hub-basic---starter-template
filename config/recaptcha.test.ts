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
		vi.unstubAllEnvs();
	});

	it("skips verification (returns true) when GOOGLE_V3_RECAPTCHA_SECRET_KEY is unset outside production", async () => {
		delete process.env.GOOGLE_V3_RECAPTCHA_SECRET_KEY;
		vi.stubEnv("NODE_ENV", "test");

		const { verifyRecaptcha } = await importFreshModule();

		expect(await verifyRecaptcha("token")).toBe(true);
	});

	it("fails closed (returns false) when GOOGLE_V3_RECAPTCHA_SECRET_KEY is unset in production", async () => {
		delete process.env.GOOGLE_V3_RECAPTCHA_SECRET_KEY;
		vi.stubEnv("NODE_ENV", "production");

		const { verifyRecaptcha } = await importFreshModule();

		expect(await verifyRecaptcha("token")).toBe(false);
	});

	it("returns true when siteverify succeeds with a score at or above the threshold", async () => {
		process.env.GOOGLE_V3_RECAPTCHA_SECRET_KEY = "secret";
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ success: true, score: 0.9, action: "comment" }) }));

		const { verifyRecaptcha } = await importFreshModule();

		expect(await verifyRecaptcha("token", "comment")).toBe(true);
	});

	it("returns false when the score is below the threshold", async () => {
		process.env.GOOGLE_V3_RECAPTCHA_SECRET_KEY = "secret";
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ success: true, score: 0.2, action: "comment" }) }));

		const { verifyRecaptcha } = await importFreshModule();

		expect(await verifyRecaptcha("token", "comment")).toBe(false);
	});

	it("returns false when the token's action does not match the expected action", async () => {
		process.env.GOOGLE_V3_RECAPTCHA_SECRET_KEY = "secret";
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ success: true, score: 0.9, action: "contact" }) }));

		const { verifyRecaptcha } = await importFreshModule();

		expect(await verifyRecaptcha("token", "comment")).toBe(false);
	});

	it("returns false when siteverify responds without success", async () => {
		process.env.GOOGLE_V3_RECAPTCHA_SECRET_KEY = "secret";
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ success: false }) }));

		const { verifyRecaptcha } = await importFreshModule();

		expect(await verifyRecaptcha("token")).toBe(false);
	});

	it("returns false for an empty token", async () => {
		process.env.GOOGLE_V3_RECAPTCHA_SECRET_KEY = "secret";

		const { verifyRecaptcha } = await importFreshModule();

		expect(await verifyRecaptcha("")).toBe(false);
	});

	it("returns false when the siteverify request throws", async () => {
		process.env.GOOGLE_V3_RECAPTCHA_SECRET_KEY = "secret";
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

		const { verifyRecaptcha } = await importFreshModule();

		expect(await verifyRecaptcha("token")).toBe(false);
	});
});
