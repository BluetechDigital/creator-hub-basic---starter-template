'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { useId, useRef, useState } from "react";
import { useFormik } from "formik";
import ReCAPTCHA from "react-google-recaptcha";
import { submitComment, ICommentFormValues } from "@/app/[locale]/posts/[slug]/actions";
import type { ISinglePostDict } from "@/app/[locale]/posts/[slug]/types/singlePost";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/app/[locale]/posts/[slug]/styles/SinglePost.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const RECAPTCHA_SITE_KEY: string | undefined = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type ICommentForm = {
	postId: number;
	/** The parent comment's global `id`, when this form is replying to a comment (`CommentsFeed.tsx`'s inline reply box) — omit for the standalone top-level comment form. */
	parentId?: string;
	/** Shown as a "Cancel" button when set — used by the inline reply box to let a visitor close it without submitting. */
	onCancel?: () => void;
	/** This route's `singlePost` dictionary slice — passed down unstripped from `page.tsx`/`CommentsFeed.tsx`, since a Client Component can't call `getDictionary()` itself. */
	dict: ISinglePostDict;
};

type IFormValues = Omit<ICommentFormValues, 'postId' | 'recaptchaToken' | 'parentId'>;

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
 *
 * Doubles as the inline reply box (`CommentsFeed.tsx` renders one per comment
 * when its "Reply" toggle is open) when `parentId`/`onCancel` are passed — same
 * fields and validation, just a compact layout with no heading and a Cancel
 * button instead of the page-level spacing. Field ids are suffixed with
 * `useId()` so multiple instances (the main form + an open reply box) never
 * collide.
 * @param postId The post's `databaseId` being commented on.
 * @param parentId The parent comment's global `id`, when replying; omit for a top-level comment.
 * @param onCancel Renders a "Cancel" button that calls this when set (reply-box mode only).
 * @param dict This route's `singlePost` dictionary slice.
 */
const CommentForm = ({ postId, parentId, onCancel, dict }: ICommentForm) => {
	const uid = useId();
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
				setGeneralError(dict.recaptchaRequired);
				setSubmitting(false);
				return;
			}

			const result = await submitComment({ ...values, postId, parentId, recaptchaToken: recaptchaToken ?? "" });

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
		<div className={`${styles.commentForm} ${parentId ? styles.commentFormCompact : ''}`}>
			{!parentId && <h2 className={styles.commentFormHeading}>{dict.leaveComment}</h2>}
			<form onSubmit={formik.handleSubmit} noValidate>
				<div className={styles.commentFormRow}>
					<div className={styles.commentFormField}>
						<label htmlFor={`comment-name-${uid}`}>{dict.nameLabel}</label>
						<input
							id={`comment-name-${uid}`}
							name="name"
							type="text"
							value={formik.values.name}
							onChange={formik.handleChange}
						/>
						{formik.errors.name ? <p className={styles.commentFormError}>{formik.errors.name}</p> : null}
					</div>

					<div className={styles.commentFormField}>
						<label htmlFor={`comment-email-${uid}`}>{dict.emailLabel}</label>
						<input
							id={`comment-email-${uid}`}
							name="email"
							type="email"
							value={formik.values.email}
							onChange={formik.handleChange}
						/>
						{formik.errors.email ? <p className={styles.commentFormError}>{formik.errors.email}</p> : null}
					</div>
				</div>

				<div className={styles.commentFormField}>
					<label htmlFor={`comment-content-${uid}`}>{parentId ? dict.reply : dict.commentLabel}</label>
					<textarea
						id={`comment-content-${uid}`}
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
				{submitted ? (
					<p role="status">{parentId ? dict.thanksReply : dict.thanksComment}</p>
				) : null}

				<div className={styles.commentFormActions}>
					<button type="submit" disabled={formik.isSubmitting} className={styles.commentFormSubmit}>
						{formik.isSubmitting ? dict.sending : parentId ? dict.reply : dict.postComment}
					</button>
					{onCancel ? (
						<button type="button" onClick={onCancel} className={styles.commentFormCancel}>
							{dict.cancel}
						</button>
					) : null}
				</div>
			</form>
		</div>
	);
};

CommentForm.displayName = 'CommentForm';

export default CommentForm;
