/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX COOKIE POLICY XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/* COOKIE POLICY: Content & Content Provider Interface */
export type IContext = {
	acceptCookies: () => void;
	refuseCookies: () => void;
	hasConsent: boolean | null;
};
export type IContextProvider = {
	children: React.ReactNode;
};