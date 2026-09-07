/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import "server-only";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const RECAPTCHA_SECRET_KEY: string | undefined = process.env.RECAPTCHA_SECRET_KEY;

// v3 returns a 0.0–1.0 score (1.0 = very likely human). Anything at or above
// this passes. Tune per traffic; 0.5 is Google's default recommendation.
const MIN_SCORE = Number(process.env.RECAPTCHA_MIN_SCORE ?? "0.5");

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX reCAPTCHA Verification XXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type ISiteVerifyResponse = {
	success: boolean;
	score?: number;
	action?: string;
	"error-codes"?: string[];
};

/**
 * Verifies a **reCAPTCHA v3** token server-side against Google's `siteverify`
 * endpoint. v3 is score-based and invisible (no widget) — the client obtains a
 * token via `useRecaptchaV3().execute(action)` and the score + the returned
 * `action` are checked here. Shared by every server-side form submission that
 * needs spam protection (contact form, comment form).
 *
 * FAIL BEHAVIOUR:
 *  - Production + `RECAPTCHA_SECRET_KEY` unset → **fail closed** (returns
 *    `false`). A production deploy with no bot protection is a misconfiguration,
 *    not a soft state to tolerate.
 *  - Non-production + secret unset → skip (returns `true`) so local dev and a
 *    fork mid-setup aren't blocked.
 *
 * @param token The v3 assessment token from the client.
 * @param expectedAction The action name the client passed to `execute()` (e.g.
 * `"comment"`, `"contact"`). When given, a token whose `action` doesn't match is
 * rejected — stops a token minted on one form being replayed against another.
 * @returns Whether the token is valid, recent, above `MIN_SCORE`, and (if
 * `expectedAction` is given) for the right action.
 */
export const verifyRecaptcha = async (token: string, expectedAction?: string): Promise<boolean> => {
	if (!RECAPTCHA_SECRET_KEY) {
		if (process.env.NODE_ENV === "production") {
			console.error("RECAPTCHA_SECRET_KEY is not set in production — rejecting the submission.");
			return false;
		}
		console.warn("RECAPTCHA_SECRET_KEY is not set; skipping reCAPTCHA verification (non-production).");
		return true;
	}

	if (!token) {
		return false;
	}

	let data: ISiteVerifyResponse;
	try {
		const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({ secret: RECAPTCHA_SECRET_KEY, response: token }),
		});
		data = await response.json();
	} catch (error) {
		console.error("reCAPTCHA siteverify request failed:", error);
		return false;
	}

	if (data.success !== true) {
		return false;
	}

	if (expectedAction && data.action !== expectedAction) {
		console.warn(`reCAPTCHA action mismatch: expected "${expectedAction}", got "${data.action}".`);
		return false;
	}

	if (typeof data.score === "number" && data.score < MIN_SCORE) {
		return false;
	}

	return true;
};
