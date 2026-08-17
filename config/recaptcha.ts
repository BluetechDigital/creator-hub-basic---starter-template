/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const RECAPTCHA_SECRET_KEY: string | undefined = process.env.RECAPTCHA_SECRET_KEY;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX reCAPTCHA Verification XXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Verifies a reCAPTCHA v2 token server-side against Google's `siteverify` endpoint.
 * Shared by every server-side form submission that needs spam protection (contact
 * form, comment form) rather than each reimplementing the same Google API call.
 * If `RECAPTCHA_SECRET_KEY` isn't configured yet for this client fork, verification
 * is skipped (returns true) rather than hard-failing every submission — a fork
 * mid-setup shouldn't have every form fully broken.
 * @param token The client-side reCAPTCHA response token to verify.
 * @returns Whether the token is valid (or verification was skipped).
 */
export const verifyRecaptcha = async (token: string): Promise<boolean> => {
	if (!RECAPTCHA_SECRET_KEY) {
		console.warn("RECAPTCHA_SECRET_KEY is not set; skipping reCAPTCHA verification.");
		return true;
	}

	const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({ secret: RECAPTCHA_SECRET_KEY, response: token }),
	});

	const data: { success: boolean } = await response.json();

	return data.success === true;
};
