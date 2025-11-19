/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { client } from "@/config/apollo";
import { ApolloClient, DocumentNode, gql } from "@apollo/client";
import * as IThemesOptions from "@/graphql/CMS/types/themesOptions";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXX Themes Option Global Content XXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/* Gets All ACF fields Content from themes option page called "Global Content" */
export const getThemesOptionsContent =
	async (): Promise<IThemesOptions.IProps | unknown> => {
		try {
			const content: DocumentNode = gql`
				{
					themeOptions(where: {name: "Global Content", status: PUBLISH}) {
						edges {
							node {
								themeOptions {
									email
									address
									emailTwo
									phoneNumber
									copyrightText
									phoneNumberTwo
									facebookLink {
										url
										title
										target
									}
									twitterLink {
										url
										title
										target
									}
									linkedinLink {
										url
										title
										target
									}
									errorPageContent {
										displaySection
										title
										paragraph
										buttonLink {
											url
											title
											target
										}
										backgroundImage {
											altText
											sourceUrl
											mediaDetails {
												height
												width
											}
										}
									}
								}
							}
						}
					}
				}
			`;

			const response: ApolloClient.QueryResult<IThemesOptions.IResponse> = await client.query<IThemesOptions.IResponse>({
				query: content,
			});

			return response?.data?.themeOptions?.edges?.[0]?.node?.themeOptions;

		} catch (error: unknown) {
			console.log(error);
			throw new Error(
				"Something went wrong trying to fetch themes options content"
			);
		}
	};
