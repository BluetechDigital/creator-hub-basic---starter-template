import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Why the dynamic import XXXXXXXXXXXXXXXXXXXXXXXXXX
EMAIL_USER/CONTACT_FORM_RECIPIENT_EMAIL/RECAPTCHA_SECRET_KEY/SITE_NAME are read into
module-scope consts on import, not re-read per call — same pattern as
api/YouTube/GetAllYoutubeContent.test.ts. Each test sets process.env *before*
importing a fresh copy of the module via vi.resetModules().
----------------------------------------------------------------------------- */

const { mockSendMail } = vi.hoisted(() => ({ mockSendMail: vi.fn() }));

vi.mock("@/config/nodemailer", () => ({
	getEmailTransporter: () => ({ sendMail: mockSendMail }),
}));

const originalEnv = { ...process.env };

const importFreshModule = async () => {
	vi.resetModules();
	return import("./actions");
};

const validSubmission = {
	name: "Jane Doe",
	email: "jane@example.test",
	message: "This is a valid message with enough length to pass validation.",
	recaptchaToken: "token",
};

describe("submitContactForm", () => {
	beforeEach(() => {
		mockSendMail.mockReset();
		mockSendMail.mockResolvedValue({});
		process.env.EMAIL_USER = "site@example.test";
		delete process.env.CONTACT_FORM_RECIPIENT_EMAIL;
		delete process.env.RECAPTCHA_SECRET_KEY;
	});

	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("returns field-level validation errors for invalid input and sends no emails", async () => {
		const { submitContactForm } = await importFreshModule();

		const result = await submitContactForm({
			name: "A",
			email: "not-an-email",
			message: "short",
			recaptchaToken: "token",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.errors.name).toBeDefined();
			expect(result.errors.email).toBeDefined();
			expect(result.errors.message).toBeDefined();
		}
		expect(mockSendMail).not.toHaveBeenCalled();
	});

	it("sends a notification email to CONTACT_FORM_RECIPIENT_EMAIL (falling back to EMAIL_USER) and a confirmation to the submitter", async () => {
		const { submitContactForm } = await importFreshModule();

		const result = await submitContactForm(validSubmission);

		expect(result.success).toBe(true);
		expect(mockSendMail).toHaveBeenCalledTimes(2);
		expect(mockSendMail).toHaveBeenCalledWith(
			expect.objectContaining({ to: "site@example.test", replyTo: "jane@example.test" }),
		);
		expect(mockSendMail).toHaveBeenCalledWith(
			expect.objectContaining({ to: "jane@example.test" }),
		);
	});

	it("delivers notifications to CONTACT_FORM_RECIPIENT_EMAIL when set, instead of EMAIL_USER", async () => {
		process.env.CONTACT_FORM_RECIPIENT_EMAIL = "owner-inbox@example.test";

		const { submitContactForm } = await importFreshModule();
		await submitContactForm(validSubmission);

		expect(mockSendMail).toHaveBeenCalledWith(
			expect.objectContaining({ to: "owner-inbox@example.test" }),
		);
	});

	it("fails reCAPTCHA verification when siteverify returns success: false, and sends no emails", async () => {
		process.env.RECAPTCHA_SECRET_KEY = "secret";
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
			json: async () => ({ success: false }),
		}));

		const { submitContactForm } = await importFreshModule();
		const result = await submitContactForm(validSubmission);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.errors.recaptcha).toBeDefined();
		}
		expect(mockSendMail).not.toHaveBeenCalled();
	});

	it("skips reCAPTCHA verification (and does not fail) when RECAPTCHA_SECRET_KEY is unset", async () => {
		const { submitContactForm } = await importFreshModule();
		const result = await submitContactForm(validSubmission);

		expect(result.success).toBe(true);
	});

	it("returns a general error rather than throwing when sendMail fails", async () => {
		mockSendMail.mockRejectedValue(new Error("SMTP down"));

		const { submitContactForm } = await importFreshModule();
		const result = await submitContactForm(validSubmission);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.errors.general).toBeDefined();
		}
	});
});
