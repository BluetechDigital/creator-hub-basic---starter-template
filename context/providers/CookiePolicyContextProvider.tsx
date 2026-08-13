"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, useEffect, useState } from "react";
import { CookiePolicyContext } from "@/context/cookies";
import * as ICookiePolicy from "@/context/types/cookies";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXX Cookie Policy Context Provider XXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Provides cookie-consent state to the app, initialized by reading `document.cookie` on
 * mount and exposing `acceptCookies`/`refuseCookies` handlers that persist the decision.
 *
 * @param children - App content to render below the provider.
 */
const CookiePolicyContextProvider: FC<ICookiePolicy.IContextProvider> = ({
	children,
}) => {
	const [hasConsent, setHasConsent] = useState<boolean | null>(null); // null, true, or false

	useEffect(() => {
		// Reads the same "cookie-consent" key that acceptCookies/refuseCookies write below.
		const cookiesAccepted = document.cookie.includes("cookie-consent=accepted");
		const cookiesRefused = document.cookie.includes("cookie-consent=refused");

		queueMicrotask(() => {
			if (cookiesAccepted) {
				setHasConsent(true);
			} else if (cookiesRefused) {
				setHasConsent(false);
			} else {
				setHasConsent(null); // No decision has been made yet
			}
		});
	}, []);

	// Accept Cookies Duration is One Month (2,592,000 seconds)
	const acceptCookies = () => {
		document.cookie = "cookie-consent=accepted; max-age=2592000; path=/";
		setHasConsent(true);
	};

	// Refuse Cookies Duration is One Month (2,592,000 seconds)
	const refuseCookies = () => {
		document.cookie = "cookie-consent=refused; max-age=2592000; path=/";
		setHasConsent(false);
	};

	const value = {
		hasConsent,
		acceptCookies,
		refuseCookies
	};

  return (
    <CookiePolicyContext.Provider value={value}>
      {children}
    </CookiePolicyContext.Provider>
  );
};

CookiePolicyContextProvider.displayName = 'CookiePolicyContextProvider';

export default CookiePolicyContextProvider;
