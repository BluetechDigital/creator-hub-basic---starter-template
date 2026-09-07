"use server";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import validator from "validator";
import { verifyRecaptcha } from "@/config/recaptcha";
import { checkRateLimit, getRequestIp } from "@/config/rateLimit";
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
	/** Honeypot — a hidden field real users never fill. A non-empty value means a bot. */
	website?: string;
};

/** More than this many URLs in one comment reads as link spam, not a reader contribution. */
const MAX_COMMENT_LINKS = 2;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Rate limit windows XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
Per-IP pre-filter (the authoritative limit is the mu-plugin's — see
`config/rateLimit.ts`). Comments: 3/min. Reactions: 20/min (a legit reader
toggling like<->dislike across several posts/comments shouldn't be blocked).
----------------------------------------------------------------------------- */
const COMMENT_RATE = { limit: 3, windowMs: 60_000 };
const REACTION_RATE = { limit: 20, windowMs: 60_000 };

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
 * Server Action for the single-post comment form: drops a honeypot-flagged
 * submission silently, pre-filters by per-IP rate limit, validates input
 * (including a link-flood cap), verifies reCAPTCHA v3 (score + `"comment"`
 * action check, same shared check as `submitContactForm`), then calls
 * `createComment` — the WordPress `ch-security.php` mu-plugin gates the
 * mutation itself with a proxy secret, so this Server Action is the only path
 * a comment can actually reach the CMS through (see `docs/comment-security.md`).
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
	// Honeypot: a bot filled the hidden field. Return the success shape without
	// doing anything — never tell the bot it was caught.
	if (values.website && values.website.trim() !== "") {
		return { success: true };
	}

	const ip = await getRequestIp();
	if (!checkRateLimit(`comment:${ip}`, COMMENT_RATE.limit, COMMENT_RATE.windowMs)) {
		return { success: false, errors: { general: "You're commenting too quickly — please wait a moment and try again." } };
	}

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

	if (content && (content.match(/https?:\/\//gi)?.length ?? 0) > MAX_COMMENT_LINKS) {
		errors.content = "Please keep links in your comment to a minimum.";
	}

	if (Object.keys(errors).length > 0) {
		return { success: false, errors };
	}

	const recaptchaValid = await verifyRecaptcha(values.recaptchaToken, "comment");

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
	const ip = await getRequestIp();
	if (!checkRateLimit(`reaction:${ip}`, REACTION_RATE.limit, REACTION_RATE.windowMs)) {
		return { success: false };
	}

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
	const ip = await getRequestIp();
	if (!checkRateLimit(`reaction:${ip}`, REACTION_RATE.limit, REACTION_RATE.windowMs)) {
		return { success: false };
	}

	const reactions = await setCommentReactionMutation(commentId, previousReaction, newReaction);

	if (!reactions) {
		return { success: false };
	}

	return { success: true, likes: reactions.likes, dislikes: reactions.dislikes };
};
