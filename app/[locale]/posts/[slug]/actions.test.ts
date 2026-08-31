import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";

/* -----------------------------------------------------------------------------
Same "mock the side-effect dependency, dynamic-import for fresh env reads" shape
as components/CMS/ContactForm/actions.test.ts.
----------------------------------------------------------------------------- */

const { mockCreateComment, mockSetPostReaction, mockSetCommentReaction } = vi.hoisted(() => ({
	mockCreateComment: vi.fn(),
	mockSetPostReaction: vi.fn(),
	mockSetCommentReaction: vi.fn(),
}));

vi.mock("@/graphql/CMS/CreateComment", () => ({
	createComment: mockCreateComment,
}));

vi.mock("@/graphql/CMS/SetPostReaction", () => ({
	setPostReaction: mockSetPostReaction,
}));

vi.mock("@/graphql/CMS/SetCommentReaction", () => ({
	setCommentReaction: mockSetCommentReaction,
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

describe("setReaction", () => {
	beforeEach(() => {
		mockSetPostReaction.mockReset();
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it("returns the new likes/dislikes counts on success", async () => {
		mockSetPostReaction.mockResolvedValue({ likes: 6, dislikes: 1 });

		const { setReaction } = await importFreshModule();
		const result = await setReaction(307, undefined, "like");

		expect(result).toEqual({ success: true, likes: 6, dislikes: 1 });
		expect(mockSetPostReaction).toHaveBeenCalledWith(307, undefined, "like");
	});

	it("passes the previous reaction through when swapping", async () => {
		mockSetPostReaction.mockResolvedValue({ likes: 5, dislikes: 2 });

		const { setReaction } = await importFreshModule();
		await setReaction(307, "like", "dislike");

		expect(mockSetPostReaction).toHaveBeenCalledWith(307, "like", "dislike");
	});

	it("returns success: false when setPostReaction resolves undefined (mu-plugin not installed, or rate-limited)", async () => {
		mockSetPostReaction.mockResolvedValue(undefined);

		const { setReaction } = await importFreshModule();
		const result = await setReaction(307, undefined, "like");

		expect(result).toEqual({ success: false });
	});
});

describe("setCommentReaction", () => {
	beforeEach(() => {
		mockSetCommentReaction.mockReset();
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it("returns the new likes/dislikes counts on success", async () => {
		mockSetCommentReaction.mockResolvedValue({ likes: 3, dislikes: 0 });

		const { setCommentReaction } = await importFreshModule();
		const result = await setCommentReaction(2, undefined, "like");

		expect(result).toEqual({ success: true, likes: 3, dislikes: 0 });
		expect(mockSetCommentReaction).toHaveBeenCalledWith(2, undefined, "like");
	});

	it("passes the previous reaction through when swapping", async () => {
		mockSetCommentReaction.mockResolvedValue({ likes: 2, dislikes: 1 });

		const { setCommentReaction } = await importFreshModule();
		await setCommentReaction(2, "like", "dislike");

		expect(mockSetCommentReaction).toHaveBeenCalledWith(2, "like", "dislike");
	});

	it("returns success: false when setCommentReaction resolves undefined (mu-plugin not installed, or rate-limited)", async () => {
		mockSetCommentReaction.mockResolvedValue(undefined);

		const { setCommentReaction } = await importFreshModule();
		const result = await setCommentReaction(2, undefined, "like");

		expect(result).toEqual({ success: false });
	});
});
