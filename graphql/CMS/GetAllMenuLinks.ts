/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { client } from "@/config/apollo";
import * as ILinks from "@/graphql/CMS/types/links";
import { ApolloClient, DocumentNode, gql } from "@apollo/client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Navbar Menu Links XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export const getAllNavbarMenuLinks =
	async (): Promise<ILinks.INavbarMenuLinks | unknown> => {
		try {
			const content: DocumentNode = gql`
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

			const response: ApolloClient.QueryResult<ILinks.IResponse> = await client.query<ILinks.IResponse>({
				query: content,
			});

			return response?.data?.menuLinks?.edges;

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
		const content: DocumentNode = gql`
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

		const response: ApolloClient.QueryResult<ILinks.IResponse> = await client.query<ILinks.IResponse>({
			query: content,
		});

		return response?.data?.menuLinks?.edges;

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
			const content: DocumentNode = gql`
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

			const response: ApolloClient.QueryResult<ILinks.IResponse> = await client.query<ILinks.IResponse>({
				query: content,
			});

			return response?.data?.menuLinks?.edges;

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
			const content: DocumentNode = gql`
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

			const response: ApolloClient.QueryResult<ILinks.IResponse> = await client.query<ILinks.IResponse>({
				query: content,
			});

			return response?.data?.menuLinks?.edges;

		} catch (error: unknown) {
			console.log(error);
			throw new Error(
				"Something went wrong trying to fetch footer menu links content"
			);
		}
	};

