'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { useRef, useState } from "react";
import { useFormik } from "formik";
import ReCAPTCHA from "react-google-recaptcha";
import { submitComment, ICommentFormValues } from "@/app/posts/[slug]/actions";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/app/posts/[slug]/styles/SinglePost.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const RECAPTCHA_SITE_KEY: string | undefined = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type ICommentForm = {
	postId: number;
};

type IFormValues = Omit<ICommentFormValues, 'postId' | 'recaptchaToken'>;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX CommentForm Component XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Comment submission form — same shape as `components/CMS/ContactForm/ContactForm.tsx`
 * (`useFormik`, no client-side validation library since `actions.ts`'s `submitComment`
 * is the single source of truth for validation rules, same reCAPTCHA widget wired to
 * the shared `submitComment` Server Action). On success, shows a generic "may take a
 * minute to appear" message instead of appending to the visible feed — deliberately
 * doesn't promise instant visibility or claim moderation either way, since whether a
 * new comment publishes immediately or waits for approval is a per-site WordPress
 * Discussion setting (`Settings → Discussion → "Comment must be manually approved"`),
 * not something this codebase controls. Even on a site with moderation off, a fresh
 * comment still won't appear instantly — `getPostComments` (see its own doc comment)
 * caches for 60s.
 * @param postId The post's `databaseId` being commented on.
 */
const CommentForm = ({ postId }: ICommentForm) => {
	const recaptchaRef = useRef<ReCAPTCHA>(null);
	const [submitted, setSubmitted] = useState(false);
	const [generalError, setGeneralError] = useState<string | null>(null);

	const formik = useFormik<IFormValues>({
		initialValues: { name: '', email: '', content: '' },
		onSubmit: async (values, { resetForm, setErrors, setSubmitting }) => {
			setSubmitted(false);
			setGeneralError(null);

			const recaptchaToken = recaptchaRef.current?.getValue();

			if (RECAPTCHA_SITE_KEY && !recaptchaToken) {
				setGeneralError("Please complete the reCAPTCHA check.");
				setSubmitting(false);
				return;
			}

			const result = await submitComment({ ...values, postId, recaptchaToken: recaptchaToken ?? "" });

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
		<div className={styles.commentForm}>
			<h2 className={styles.commentFormHeading}>Leave a comment</h2>
			<form onSubmit={formik.handleSubmit} noValidate>
				<div className={styles.commentFormField}>
					<label htmlFor="comment-name">Name</label>
					<input
						id="comment-name"
						name="name"
						type="text"
						value={formik.values.name}
						onChange={formik.handleChange}
					/>
					{formik.errors.name ? <p className={styles.commentFormError}>{formik.errors.name}</p> : null}
				</div>

				<div className={styles.commentFormField}>
					<label htmlFor="comment-email">Email</label>
					<input
						id="comment-email"
						name="email"
						type="email"
						value={formik.values.email}
						onChange={formik.handleChange}
					/>
					{formik.errors.email ? <p className={styles.commentFormError}>{formik.errors.email}</p> : null}
				</div>

				<div className={styles.commentFormField}>
					<label htmlFor="comment-content">Comment</label>
					<textarea
						id="comment-content"
						name="content"
						value={formik.values.content}
						onChange={formik.handleChange}
					/>
					{formik.errors.content ? <p className={styles.commentFormError}>{formik.errors.content}</p> : null}
				</div>

				{RECAPTCHA_SITE_KEY ? (
					<ReCAPTCHA ref={recaptchaRef} sitekey={RECAPTCHA_SITE_KEY} />
				) : null}

				{generalError ? <p className={styles.commentFormError} role="alert">{generalError}</p> : null}
				{submitted ? <p role="status">Thanks for your comment! It may take a minute to appear.</p> : null}

				<button type="submit" disabled={formik.isSubmitting} className={styles.commentFormSubmit}>
					{formik.isSubmitting ? 'Sending...' : 'Post comment'}
				</button>
			</form>
		</div>
	);
};

CommentForm.displayName = 'CommentForm';

export default CommentForm;
