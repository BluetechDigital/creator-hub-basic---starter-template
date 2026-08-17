"use server";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import validator from "validator";
import { verifyRecaptcha } from "@/config/recaptcha";
import { createComment } from "@/graphql/CMS/CreateComment";
import { setPostReaction, IReaction } from "@/graphql/CMS/SetPostReaction";
import { setCommentReaction as setCommentReactionMutation } from "@/graphql/CMS/SetCommentReaction";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export type ICommentFormValues = {
	postId: number;
	name: string;
	email: string;
	content: string;
	recaptchaToken: string;
	/** The parent comment's global GraphQL `id`, when replying; omit for a top-level comment. */
	parentId?: string;
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
 * A `{success: true}` result means the comment was accepted, not that it's
 * necessarily publicly visible yet — whether a new comment publishes immediately
 * or waits for manual approval is a per-site WordPress Discussion setting (see
 * `CreateComment.ts`'s doc comment), so the caller shows a generic "may take a
 * moment" message rather than asserting either behaviour.
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
			parentId: values.parentId,
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
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Set Reaction XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Server Action for the like/dislike buttons: swaps a post's reaction via
 * `setPostReaction`. Reactions are mutually exclusive, so the caller passes both
 * the visitor's previous reaction (to decrement) and their new one (to increment)
 * in one call. No reCAPTCHA — a reaction click isn't a form submission and a
 * captcha there would be poor UX; abuse is instead guarded by the client-side
 * "current reaction" cookie (`EngagementBar.tsx`) plus the mu-plugin's own
 * server-side per-post/per-IP rate limit (see
 * `wordpress-mu-plugins/simple-blogs-post-likes.php`).
 * @param postId The post's `databaseId` to react to.
 * @param previousReaction The visitor's reaction before this change, or
 * `undefined` if they had none.
 * @param newReaction The visitor's new reaction, or `"none"` to just clear their
 * previous reaction.
 * @returns `{success: true, likes, dislikes}` with the new counts, or
 * `{success: false}` if the mu-plugin isn't installed yet, the rate limit
 * rejected the request, or the request otherwise failed.
 */
export const setReaction = async (
	postId: number,
	previousReaction: IReaction | undefined,
	newReaction: IReaction | "none"
): Promise<{ success: true; likes: number; dislikes: number } | { success: false }> => {
	const reactions = await setPostReaction(postId, previousReaction, newReaction);

	if (!reactions) {
		return { success: false };
	}

	return { success: true, likes: reactions.likes, dislikes: reactions.dislikes };
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Set Comment Reaction XXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Server Action for a comment's like/dislike buttons (`CommentReactions.tsx`)
 * — same shape as `setReaction` above, just targeting `setCommentReaction`
 * instead of `setPostReaction`. Kept as a separate action (not a shared
 * `postId | commentId` parameter) since posts and comments are reacted to
 * from different components with different cookie keys, and a single
 * combined action would need a discriminator anyway.
 * @param commentId The comment's `databaseId` to react to.
 * @param previousReaction The visitor's reaction before this change, or
 * `undefined` if they had none.
 * @param newReaction The visitor's new reaction, or `"none"` to just clear their
 * previous reaction.
 * @returns `{success: true, likes, dislikes}` with the new counts, or
 * `{success: false}` if the mu-plugin isn't installed yet, the rate limit
 * rejected the request, or the request otherwise failed.
 */
export const setCommentReaction = async (
	commentId: number,
	previousReaction: IReaction | undefined,
	newReaction: IReaction | "none"
): Promise<{ success: true; likes: number; dislikes: number } | { success: false }> => {
	const reactions = await setCommentReactionMutation(commentId, previousReaction, newReaction);

	if (!reactions) {
		return { success: false };
	}

	return { success: true, likes: reactions.likes, dislikes: reactions.dislikes };
};
