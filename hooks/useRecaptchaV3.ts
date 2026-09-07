"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { useCallback, useEffect } from "react";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const SITE_KEY: string | undefined = process.env.NEXT_PUBLIC_GOOGLE_V3_RECAPTCHA_SITE_KEY;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX grecaptcha global shape XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IGrecaptcha = {
	ready: (cb: () => void) => void;
	execute: (siteKey: string, options: { action: string }) => Promise<string>;
};

declare global {
	interface Window {
		grecaptcha?: IGrecaptcha;
	}
}

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Script loader (once) XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const SCRIPT_ID = "recaptcha-v3";

const loadRecaptchaScript = () => {
	if (!SITE_KEY || typeof document === "undefined" || document.getElementById(SCRIPT_ID)) {
		return;
	}
	const script = document.createElement("script");
	script.id = SCRIPT_ID;
	script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
	script.async = true;
	document.head.appendChild(script);
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX useRecaptchaV3 hook XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Loads the reCAPTCHA v3 script and returns an `execute(action)` that resolves
 * to a fresh assessment token to send to a Server Action, where
 * `verifyRecaptcha` checks its score + `action` against Google.
 *
 * v3 is invisible — no checkbox, no user interaction — so this replaces the v2
 * `<ReCAPTCHA>` widget entirely. When `NEXT_PUBLIC_GOOGLE_V3_RECAPTCHA_SITE_KEY` is unset
 * (a fork mid-setup) `execute` resolves to `""`; the Server Action then decides
 * whether to allow that (dev) or reject it (production) — see `verifyRecaptcha`.
 *
 * The badge Google injects bottom-right must stay visible OR be replaced with
 * the "protected by reCAPTCHA / Privacy / Terms" text link per Google's terms.
 */
export const useRecaptchaV3 = () => {
	useEffect(() => {
		loadRecaptchaScript();
	}, []);

	return useCallback(async (action: string): Promise<string> => {
		if (!SITE_KEY || typeof window === "undefined" || !window.grecaptcha) {
			return "";
		}
		return new Promise<string>((resolve) => {
			window.grecaptcha!.ready(() => {
				window.grecaptcha!
					.execute(SITE_KEY, { action })
					.then(resolve)
					.catch(() => resolve(""));
			});
		});
	}, []);
};
