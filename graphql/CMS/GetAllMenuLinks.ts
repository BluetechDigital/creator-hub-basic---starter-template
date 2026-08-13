/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as ILinks from "@/graphql/CMS/types/links";
import { IGraphQLResponse } from "@/graphql/CMS/types/graphqlResponse";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const GRAPHQL_ENDPOINT: string | undefined = process.env.NEXT_PUBLIC_CMS_API_URL;
if (!GRAPHQL_ENDPOINT) throw new Error("NEXT_PUBLIC_CMS_API_URL not defined.");

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Shared Query Runner XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Shared executor used by all four `getAll*Links` exports below: posts the given
 * GraphQL query to the CMS and unwraps the `menuLinks` field from the response.
 * Unlike the other query files in this folder, failures here resolve to `null`
 * instead of throwing, so callers must treat a `null`/`undefined` result as
 * "no links available" rather than relying on a try/catch to surface the failure.
 * @param query The raw GraphQL query string to execute.
 * @returns The `menuLinks` field of the response, or `null` on network/HTTP failure or GraphQL errors.
 */
const runMenuLinksQuery = async (query: string): Promise<NonNullable<ILinks.IResponse>["menuLinks"]> => {
	const nextJSFetchResponse: Response = await fetch(GRAPHQL_ENDPOINT!, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query }),
		next: { revalidate: 86400 },
	});

	if (!nextJSFetchResponse.ok) {
		console.error(`Menu links fetch failed with status: ${nextJSFetchResponse.status}`);
		return null;
	}

	const response: IGraphQLResponse<ILinks.IResponse> = await nextJSFetchResponse.json();

	if (response.errors) {
		console.error("Menu links query returned errors:", response.errors);
		return null;
	}

	return response?.data?.menuLinks ?? null;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Navbar Menu Links XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Fetches the primary desktop navbar menu links from the CMS. Unlike
 * `getAllMobileLinks`/`getAllCopyrightLinks`, this query has no `first` limit,
 * so it returns every menu item assigned to the PRIMARY location (the `first: 10`
 * cap used by the other two is inconsistent with this and `getAllFooterMenuLinks`).
 * @returns A promise resolving to the array of link edges, or `unknown` if the query failed.
 */
export const getAllNavbarMenuLinks =
	async (): Promise<ILinks.INavbarMenuLinks | unknown> => {
		try {
			const content = `
				{
					menuLinks: menuItems(where: {location: PRIMARY}) {
						edges {
							node {
								id
								url
								label
							}
						}
					}
				}
			`;

			const menuLinks = await runMenuLinksQuery(content);

			return menuLinks?.edges;

		} catch (error: unknown) {
			console.log(error);
			throw new Error(
				"Something went wrong trying to fetch navbar menu links content"
			);
		}
	};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX Mobile Navbar Menu Links XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Fetches the mobile-only navbar menu links from the CMS, capped at the first
 * 10 items (`first: 10`). This cap is inconsistent with `getAllNavbarMenuLinks`/
 * `getAllFooterMenuLinks`, which fetch an unbounded list — if a mobile menu ever
 * needs more than 10 items, this limit will silently truncate the rest.
 * @returns A promise resolving to the array of link edges, or `unknown` if the query failed.
 */
export const getAllMobileLinks = async (): Promise<ILinks.IMobileLinks | unknown> => {
	try {
		const content = `
			{
				menuLinks: menuItems(where: {location: MOBILE_LINKS}, first: 10) {
					edges {
						node {
							id
							url
							label
						}
					}
				}
			}
		`;

		const menuLinks = await runMenuLinksQuery(content);

		return menuLinks?.edges;

	} catch (error: unknown) {
		console.log(error);
		throw new Error(
			"Something went wrong trying to fetch mobile links content"
		);
	}
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Copyright Links XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Fetches the copyright-bar menu links from the CMS, capped at the first 10
 * items (`first: 10`). As with `getAllMobileLinks`, this cap is inconsistent
 * with `getAllNavbarMenuLinks`/`getAllFooterMenuLinks`, which are unbounded.
 * @returns A promise resolving to the array of link edges, or `unknown` if the query failed.
 */
export const getAllCopyrightLinks =
	async (): Promise<ILinks.ICopyrightLinks | unknown> => {
		try {
			const content = `
				{
					menuLinks: menuItems(
						where: {location: COPYRIGHT_LINKS}
						first: 10
					) {
						edges {
							node {
								id
								url
								label
							}
						}
					}
				}
			`;

			const menuLinks = await runMenuLinksQuery(content);

			return menuLinks?.edges;

		} catch (error: unknown) {
			console.log(error);
			throw new Error(
				"Something went wrong trying to fetch copyright links content"
			);
		}
	};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Footer Links XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Fetches the footer menu links from the CMS. Like `getAllNavbarMenuLinks`,
 * this query has no `first` limit, so it returns every menu item assigned to
 * the FOOTER location.
 * @returns A promise resolving to the array of link edges, or `unknown` if the query failed.
 */
export const getAllFooterMenuLinks =
	async (): Promise<ILinks.IFooterMenuLinks | unknown> => {
		try {
			const content = `
				{
					menuLinks: menuItems(where: {location: FOOTER}) {
						edges {
							node {
								id
								url
								label
							}
						}
					}
				}
			`;

			const menuLinks = await runMenuLinksQuery(content);

			return menuLinks?.edges;

		} catch (error: unknown) {
			console.log(error);
			throw new Error(
				"Something went wrong trying to fetch footer menu links content"
			);
		}
	};
