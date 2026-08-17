import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";

/* -----------------------------------------------------------------------------
Same "mock the side-effect dependency, dynamic-import for fresh env reads" shape
as components/CMS/ContactForm/actions.test.ts.
----------------------------------------------------------------------------- */

const { mockCreateComment, mockIncrementPostLikes } = vi.hoisted(() => ({
	mockCreateComment: vi.fn(),
	mockIncrementPostLikes: vi.fn(),
}));

vi.mock("@/graphql/CMS/CreateComment", () => ({
	createComment: mockCreateComment,
}));

vi.mock("@/graphql/CMS/IncrementPostLikes", () => ({
	incrementPostLikes: mockIncrementPostLikes,
}));

const originalEnv = { ...process.env };

const importFreshModule = async () => {
	vi.resetModules();
	return import("./actions");
};

const validSubmission = {
	postId: 307,
	name: "Jane Doe",
	email: "jane@example.test",
	content: "This is a valid comment.",
	recaptchaToken: "token",
};

describe("submitComment", () => {
	beforeEach(() => {
		mockCreateComment.mockReset();
		mockCreateComment.mockResolvedValue({ success: true });
		delete process.env.RECAPTCHA_SECRET_KEY;
	});

	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("returns field-level validation errors for invalid input and calls createComment with nothing", async () => {
		const { submitComment } = await importFreshModule();

		const result = await submitComment({
			postId: 307,
			name: "A",
			email: "not-an-email",
			content: "x",
			recaptchaToken: "token",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.errors.name).toBeDefined();
			expect(result.errors.email).toBeDefined();
			expect(result.errors.content).toBeDefined();
		}
		expect(mockCreateComment).not.toHaveBeenCalled();
	});

	it("submits the comment on valid input", async () => {
		const { submitComment } = await importFreshModule();

		const result = await submitComment(validSubmission);

		expect(result.success).toBe(true);
		expect(mockCreateComment).toHaveBeenCalledWith({
			postId: 307,
			authorName: "Jane Doe",
			authorEmail: "jane@example.test",
			content: "This is a valid comment.",
		});
	});

	it("fails reCAPTCHA verification when siteverify returns success: false, and submits no comment", async () => {
		process.env.RECAPTCHA_SECRET_KEY = "secret";
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ success: false }) }));

		const { submitComment } = await importFreshModule();
		const result = await submitComment(validSubmission);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.errors.recaptcha).toBeDefined();
		}
		expect(mockCreateComment).not.toHaveBeenCalled();
	});

	it("returns a general error rather than throwing when createComment reports failure", async () => {
		mockCreateComment.mockResolvedValue({ success: false });

		const { submitComment } = await importFreshModule();
		const result = await submitComment(validSubmission);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.errors.general).toBeDefined();
		}
	});

	it("returns a general error rather than throwing when createComment rejects", async () => {
		mockCreateComment.mockRejectedValue(new Error("network down"));

		const { submitComment } = await importFreshModule();
		const result = await submitComment(validSubmission);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.errors.general).toBeDefined();
		}
	});
});

describe("incrementLike", () => {
	beforeEach(() => {
		mockIncrementPostLikes.mockReset();
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it("returns the new like count on success", async () => {
		mockIncrementPostLikes.mockResolvedValue(6);

		const { incrementLike } = await importFreshModule();
		const result = await incrementLike(307);

		expect(result).toEqual({ success: true, likes: 6 });
	});

	it("returns success: false when incrementPostLikes resolves undefined (mu-plugin not installed, or rate-limited)", async () => {
		mockIncrementPostLikes.mockResolvedValue(undefined);

		const { incrementLike } = await importFreshModule();
		const result = await incrementLike(307);

		expect(result).toEqual({ success: false });
	});
});
