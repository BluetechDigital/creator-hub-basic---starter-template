'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, useRef, useState } from "react";
import { useFormik } from "formik";
import ReCAPTCHA from "react-google-recaptcha";
import * as IContactForm from "@/components/CMS/ContactForm/types/contactForm";
import { submitContactForm, IContactFormValues } from "@/components/CMS/ContactForm/actions";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/ContactForm/styles/ContactForm.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const RECAPTCHA_SITE_KEY: string | undefined = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

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
 * duplicated on both sides.
 */
const ContactForm: FC<IContactForm.IProps> = ({}) => {
	const recaptchaRef = useRef<ReCAPTCHA>(null);
	const [submitted, setSubmitted] = useState(false);
	const [generalError, setGeneralError] = useState<string | null>(null);

	const formik = useFormik<IFormValues>({
		initialValues: { name: '', email: '', message: '' },
		onSubmit: async (values, { resetForm, setErrors, setSubmitting }) => {
			setSubmitted(false);
			setGeneralError(null);

			const recaptchaToken = recaptchaRef.current?.getValue();

			if (RECAPTCHA_SITE_KEY && !recaptchaToken) {
				setGeneralError("Please complete the reCAPTCHA check.");
				setSubmitting(false);
				return;
			}

			const result = await submitContactForm({ ...values, recaptchaToken: recaptchaToken ?? "" });

			recaptchaRef.current?.reset();

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

				{RECAPTCHA_SITE_KEY ? (
					<ReCAPTCHA ref={recaptchaRef} sitekey={RECAPTCHA_SITE_KEY} />
				) : null}

				{generalError ? <p className={styles.errorText} role="alert">{generalError}</p> : null}
				{submitted ? <p role="status">Thanks — your message has been sent.</p> : null}

				<button type="submit" disabled={formik.isSubmitting}>
					{formik.isSubmitting ? 'Sending...' : 'Send message'}
				</button>
			</form>
		</div>
	);
};

ContactForm.displayName = 'ContactForm';

export default ContactForm;
