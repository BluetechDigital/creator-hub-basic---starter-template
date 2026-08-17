"use server";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import validator from "validator";
import { render } from "@react-email/components";
import { getEmailTransporter } from "@/config/nodemailer";
import { verifyRecaptcha } from "@/config/recaptcha";
import ContactNotificationEmail from "@/components/CMS/ContactForm/emails/ContactNotificationEmail";
import ContactConfirmationEmail from "@/components/CMS/ContactForm/emails/ContactConfirmationEmail";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const EMAIL_USER: string | undefined = process.env.EMAIL_USER;
// Falls back to EMAIL_USER (the SMTP-authenticating address) if unset, but lets a
// creator receive submissions at a different inbox (e.g. their personal Gmail) than
// whichever address the site sends mail *as*.
const CONTACT_FORM_RECIPIENT_EMAIL: string | undefined = process.env.CONTACT_FORM_RECIPIENT_EMAIL || EMAIL_USER;
const SITE_NAME: string | undefined = process.env.SITE_NAME;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export type IContactFormValues = {
	name: string;
	email: string;
	message: string;
	recaptchaToken: string;
};

type IContactFormErrors = {
	name?: string;
	email?: string;
	message?: string;
	recaptcha?: string;
	general?: string;
};

export type IContactFormResult =
	| { success: true }
	| { success: false; errors: IContactFormErrors };

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Submit Contact Form XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Server Action for the contact form: validates input, verifies reCAPTCHA, and sends
 * two emails — a "Receiver" notification to `CONTACT_FORM_RECIPIENT_EMAIL` and a
 * "Sender" auto-reply confirmation back to the submitter (the package sheet's "Custom
 * Designed Sender & Receiver" email template line item). Both are rendered from the
 * shared `EmailLayout` structure in `ContactForm/emails/`.
 * @param values The submitted form values, including the reCAPTCHA response token.
 * @returns `{success: true}`, or `{success: false, errors}` with field-level messages
 * (validation failures) or a `general`/`recaptcha` message (verification or send failures).
 */
export const submitContactForm = async (values: IContactFormValues): Promise<IContactFormResult> => {
	const errors: IContactFormErrors = {};

	const name = values.name?.trim() ?? "";
	const email = values.email?.trim() ?? "";
	const message = values.message?.trim() ?? "";

	if (!name || !validator.isLength(name, { min: 2, max: 100 })) {
		errors.name = "Please enter your name (2-100 characters).";
	}

	if (!email || !validator.isEmail(email)) {
		errors.email = "Please enter a valid email address.";
	}

	if (!message || !validator.isLength(message, { min: 10, max: 5000 })) {
		errors.message = "Please enter a message (10-5000 characters).";
	}

	if (Object.keys(errors).length > 0) {
		return { success: false, errors };
	}

	const recaptchaValid = await verifyRecaptcha(values.recaptchaToken);

	if (!recaptchaValid) {
		return { success: false, errors: { recaptcha: "reCAPTCHA verification failed. Please try again." } };
	}

	if (!CONTACT_FORM_RECIPIENT_EMAIL) {
		console.error("No contact form recipient configured (CONTACT_FORM_RECIPIENT_EMAIL or EMAIL_USER).");
		return { success: false, errors: { general: "This form isn't fully configured yet. Please try again later." } };
	}

	try {
		const transporter = getEmailTransporter();

		const [notificationHtml, confirmationHtml] = await Promise.all([
			render(<ContactNotificationEmail name={name} email={email} message={message} siteName={SITE_NAME} />),
			render(<ContactConfirmationEmail name={name} siteName={SITE_NAME} />),
		]);

		await Promise.all([
			transporter.sendMail({
				from: EMAIL_USER,
				to: CONTACT_FORM_RECIPIENT_EMAIL,
				replyTo: email,
				subject: `New contact form submission from ${name}`,
				html: notificationHtml,
			}),
			transporter.sendMail({
				from: EMAIL_USER,
				to: email,
				subject: SITE_NAME ? `We've received your message — ${SITE_NAME}` : "We've received your message",
				html: confirmationHtml,
			}),
		]);

		return { success: true };
	} catch (error: unknown) {
		console.error("Failed to send contact form emails:", error);
		return { success: false, errors: { general: "Something went wrong sending your message. Please try again." } };
	}
};
