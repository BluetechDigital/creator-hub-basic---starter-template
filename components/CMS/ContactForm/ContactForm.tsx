'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, useState } from "react";
import { useFormik } from "formik";
import { useRecaptchaV3 } from "@/hooks/useRecaptchaV3";
import * as IContactForm from "@/components/CMS/ContactForm/types/contactForm";
import { submitContactForm, IContactFormValues } from "@/components/CMS/ContactForm/actions";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/ContactForm/styles/ContactForm.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const RECAPTCHA_SITE_KEY: string | undefined = process.env.NEXT_PUBLIC_GOOGLE_V3_RECAPTCHA_SITE_KEY;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX ContactForm Component XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IFormValues = Omit<IContactFormValues, 'recaptchaToken'>;

/**
 * ContactForm CMS block — minimal functional contact form (name/email/message +
 * reCAPTCHA), wired end-to-end to the `submitContactForm` Server Action
 * (`ContactForm/actions.ts`). Deliberately unstyled beyond the base CSS module
 * class: this proves the submit → validate → email pipeline works, it doesn't
 * match any one creator's Figma design — real markup/styling comes from the
 * per-client design build (see `ARCHITECTURE.md`). Validation is intentionally
 * server-only (no client-side `validate`/`validationSchema`) so the `validator`
 * rules in `actions.ts` stay the single source of truth rather than being
 * duplicated on both sides. Invisible reCAPTCHA v3 via `useRecaptchaV3` — no
 * widget, no user interaction; see `hooks/useRecaptchaV3.ts`.
 */
const ContactForm: FC<IContactForm.IProps> = ({}) => {
	const executeRecaptcha = useRecaptchaV3();
	const [submitted, setSubmitted] = useState(false);
	const [generalError, setGeneralError] = useState<string | null>(null);

	const formik = useFormik<IFormValues>({
		initialValues: { name: '', email: '', message: '' },
		onSubmit: async (values, { resetForm, setErrors, setSubmitting }) => {
			setSubmitted(false);
			setGeneralError(null);

			const recaptchaToken = await executeRecaptcha("contact");

			if (RECAPTCHA_SITE_KEY && !recaptchaToken) {
				setGeneralError("Verification failed — please try again.");
				setSubmitting(false);
				return;
			}

			const result = await submitContactForm({ ...values, recaptchaToken });

			if (result.success) {
				setSubmitted(true);
				resetForm();
			} else {
				const { general, recaptcha, ...fieldErrors } = result.errors;
				setErrors(fieldErrors);
				setGeneralError(general ?? recaptcha ?? null);
			}

			setSubmitting(false);
		},
	});

	return (
		<div className={styles.contactForm}>
			<form className={styles.form} onSubmit={formik.handleSubmit} noValidate>
				<div className={styles.field}>
					<label htmlFor="contact-name">Name</label>
					<input
						id="contact-name"
						name="name"
						type="text"
						value={formik.values.name}
						onChange={formik.handleChange}
					/>
					{formik.errors.name ? <p className={styles.errorText}>{formik.errors.name}</p> : null}
				</div>

				<div className={styles.field}>
					<label htmlFor="contact-email">Email</label>
					<input
						id="contact-email"
						name="email"
						type="email"
						value={formik.values.email}
						onChange={formik.handleChange}
					/>
					{formik.errors.email ? <p className={styles.errorText}>{formik.errors.email}</p> : null}
				</div>

				<div className={styles.field}>
					<label htmlFor="contact-message">Message</label>
					<textarea
						id="contact-message"
						name="message"
						value={formik.values.message}
						onChange={formik.handleChange}
					/>
					{formik.errors.message ? <p className={styles.errorText}>{formik.errors.message}</p> : null}
				</div>

				{generalError ? <p className={styles.errorText} role="alert">{generalError}</p> : null}
				{submitted ? <p role="status">Thanks — your message has been sent.</p> : null}

				<button type="submit" disabled={formik.isSubmitting}>
					{formik.isSubmitting ? 'Sending...' : 'Send message'}
				</button>

				{RECAPTCHA_SITE_KEY ? (
					<p className={styles.recaptchaNote}>
						This site is protected by reCAPTCHA and the Google{' '}
						<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>{' '}
						and{' '}
						<a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>{' '}
						apply.
					</p>
				) : null}
			</form>
		</div>
	);
};

ContactForm.displayName = 'ContactForm';

export default ContactForm;
