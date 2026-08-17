import { describe, it, expect, afterEach, vi } from "vitest";

const originalEnv = { ...process.env };

const importFreshModule = async () => {
	vi.resetModules();
	return import("./CreateComment");
};

const setCmsEnv = () => {
	process.env.NEXT_PUBLIC_CMS_API_URL = "https://example.test/graphql";
};

const validArgs = {
	postId: 307,
	authorName: "Jane Doe",
	authorEmail: "jane@example.test",
	content: "Great post!",
};

describe("createComment", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("throws when NEXT_PUBLIC_CMS_API_URL is missing", async () => {
		delete process.env.NEXT_PUBLIC_CMS_API_URL;

		await expect(importFreshModule()).rejects.toThrow("NEXT_PUBLIC_CMS_API_URL not defined.");
	});

	it("returns success on a successful submission and sends args as GraphQL variables", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ data: { createComment: { success: true } } }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { createComment } = await importFreshModule();
		const result = await createComment(validArgs);

		expect(result).toEqual({ success: true });

		const [, requestInit] = mockFetch.mock.calls[0];
		const body = JSON.parse((requestInit as RequestInit).body as string);

		expect(body.variables).toEqual(validArgs);
		expect(body.query).not.toContain("Jane Doe");
	});

	it("includes parentId as a GraphQL variable when replying", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ data: { createComment: { success: true } } }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { createComment } = await importFreshModule();
		await createComment({ ...validArgs, parentId: "Y29tbWVudDoy" });

		const [, requestInit] = mockFetch.mock.calls[0];
		const body = JSON.parse((requestInit as RequestInit).body as string);

		expect(body.variables).toEqual({ ...validArgs, parentId: "Y29tbWVudDoy" });
	});

	it("returns undefined when the HTTP response is not ok", async () => {
		setCmsEnv();

		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

		const { createComment } = await importFreshModule();

		expect(await createComment(validArgs)).toBeUndefined();
	});

	it("returns undefined when the GraphQL response contains errors", async () => {
		setCmsEnv();

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ errors: [{ message: "Comment must include an authorName." }] }),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { createComment } = await importFreshModule();

		expect(await createComment(validArgs)).toBeUndefined();
	});

	it("wraps a thrown fetch error in a generic error", async () => {
		setCmsEnv();

		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

		const { createComment } = await importFreshModule();

		await expect(createComment(validArgs)).rejects.toThrow(
			"Something went wrong trying to submit the comment",
		);
	});
});
