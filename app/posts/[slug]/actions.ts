"use server";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import validator from "validator";
import { verifyRecaptcha } from "@/config/recaptcha";
import { createComment } from "@/graphql/CMS/CreateComment";
import { incrementPostLikes } from "@/graphql/CMS/IncrementPostLikes";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export type ICommentFormValues = {
	postId: number;
	name: string;
	email: string;
	content: string;
	recaptchaToken: string;
};

type ICommentFormErrors = {
	name?: string;
	email?: string;
	content?: string;
	recaptcha?: string;
	general?: string;
};

export type ICommentFormResult =
	| { success: true }
	| { success: false; errors: ICommentFormErrors };

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Submit Comment XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Server Action for the single-post comment form: validates input, verifies
 * reCAPTCHA (same shared check as `submitContactForm`), then calls `createComment`.
 * A `{success: true}` result means the comment was accepted, not that it's publicly
 * visible yet — confirmed live against this app's actual WordPress install that new
 * comments are held for moderation by default (see `CreateComment.ts`'s doc
 * comment) — the caller should show an "awaiting approval" message.
 * @param values The submitted form values, including the reCAPTCHA response token.
 * @returns `{success: true}`, or `{success: false, errors}` with field-level messages
 * (validation failures) or a `general`/`recaptcha` message (verification or submit failures).
 */
export const submitComment = async (values: ICommentFormValues): Promise<ICommentFormResult> => {
	const errors: ICommentFormErrors = {};

	const name = values.name?.trim() ?? "";
	const email = values.email?.trim() ?? "";
	const content = values.content?.trim() ?? "";

	if (!name || !validator.isLength(name, { min: 2, max: 100 })) {
		errors.name = "Please enter your name (2-100 characters).";
	}

	if (!email || !validator.isEmail(email)) {
		errors.email = "Please enter a valid email address.";
	}

	if (!content || !validator.isLength(content, { min: 2, max: 5000 })) {
		errors.content = "Please enter a comment (2-5000 characters).";
	}

	if (Object.keys(errors).length > 0) {
		return { success: false, errors };
	}

	const recaptchaValid = await verifyRecaptcha(values.recaptchaToken);

	if (!recaptchaValid) {
		return { success: false, errors: { recaptcha: "reCAPTCHA verification failed. Please try again." } };
	}

	try {
		const result = await createComment({
			postId: values.postId,
			authorName: name,
			authorEmail: email,
			content,
		});

		if (!result?.success) {
			return { success: false, errors: { general: "Something went wrong submitting your comment. Please try again." } };
		}

		return { success: true };
	} catch (error: unknown) {
		console.error("Failed to submit comment:", error);
		return { success: false, errors: { general: "Something went wrong submitting your comment. Please try again." } };
	}
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Increment Like XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Server Action for the like button: increments a post's like count via
 * `incrementPostLikes`. No reCAPTCHA — a like click isn't a form submission and a
 * captcha there would be poor UX; abuse is instead guarded by the client-side
 * "already liked" cookie (`EngagementBar.tsx`) plus the mu-plugin's own server-side
 * per-post/per-IP rate limit (see `wordpress-mu-plugins/creator-hub-likes.php`).
 * @param postId The post's `databaseId` to like.
 * @returns `{success: true, likes}` with the new count, or `{success: false}` if
 * the mu-plugin isn't installed yet, the rate limit rejected the request, or the
 * request otherwise failed.
 */
export const incrementLike = async (postId: number): Promise<{ success: true; likes: number } | { success: false }> => {
	const likes = await incrementPostLikes(postId);

	if (typeof likes !== "number") {
		return { success: false };
	}

	return { success: true, likes };
};
