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

	return response?.data?.menuLinks ?? null;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Navbar Menu Links XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

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
