import { describe, it, expect, afterEach, vi } from "vitest";

/* -----------------------------------------------------------------------------
Module reads WP_APPLICATION_USERNAME / WP_APPLICATION_PASSWORD into module-scope
consts on import — set process.env first, then import a fresh copy.
----------------------------------------------------------------------------- */

const originalEnv = { ...process.env };

const importFresh = async () => {
	vi.resetModules();
	return import("./wordpressAuth");
};

describe("wordpressAuthHeaders", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it("returns an empty object when both credentials are unset", async () => {
		delete process.env.WP_APPLICATION_USERNAME;
		delete process.env.WP_APPLICATION_PASSWORD;

		const { wordpressAuthHeaders } = await importFresh();
		expect(wordpressAuthHeaders()).toEqual({});
	});

	it("returns an empty object when only the username is set", async () => {
		process.env.WP_APPLICATION_USERNAME = "creator";
		delete process.env.WP_APPLICATION_PASSWORD;

		const { wordpressAuthHeaders } = await importFresh();
		expect(wordpressAuthHeaders()).toEqual({});
	});

	it("returns a Basic auth header built from both credentials", async () => {
		process.env.WP_APPLICATION_USERNAME = "creator";
		process.env.WP_APPLICATION_PASSWORD = "abcd 1234 efgh 5678";

		const { wordpressAuthHeaders } = await importFresh();
		const expected = Buffer.from("creator:abcd 1234 efgh 5678").toString("base64");
		expect(wordpressAuthHeaders()).toEqual({ Authorization: `Basic ${expected}` });
	});
});
