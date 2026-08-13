/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IThemesOptions from "@/graphql/CMS/types/themesOptions";
import { IGraphQLResponse } from "@/graphql/CMS/types/graphqlResponse";

const GRAPHQL_ENDPOINT: string | undefined = process.env.NEXT_PUBLIC_CMS_API_URL;
if (!GRAPHQL_ENDPOINT) throw new Error("NEXT_PUBLIC_CMS_API_URL not defined.");

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXX Themes Option Global Content XXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/* Gets All ACF fields Content from themes option page called "Global Content" */
export const getThemesOptionsContent =
	async (): Promise<IThemesOptions.IProps | unknown> => {
		try {
			const content = `
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
									lineLink {
										url
										title
										target
									}
									spotifyLink {
										url
										title
										target
									}
									snapchatLink {
										url
										title
										target
									}
									discordLink {
										url
										title
										target
									}
									tiktokLink {
										url
										title
										target
									}
									twitchLink {
										url
										title
										target
									}
									threadsLink {
										url
										title
										target
									}
									pinterestLink {
										url
										title
										target
									}
									redditLink {
										url
										title
										target
									}
									whatsappLink {
										url
										title
										target
									}
									wechatLink {
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

			const nextJSFetchResponse: Response = await fetch(GRAPHQL_ENDPOINT, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query: content }),
				next: { revalidate: 86400 },
			});

			if (!nextJSFetchResponse.ok) {
				console.error(`Theme options fetch failed with status: ${nextJSFetchResponse.status}`);
				return undefined;
			}

			const response: IGraphQLResponse<IThemesOptions.IResponse> = await nextJSFetchResponse.json();

			return response?.data?.themeOptions?.edges?.[0]?.node?.themeOptions;

		} catch (error: unknown) {
			console.log(error);
			throw new Error(
				"Something went wrong trying to fetch themes options content"
			);
		}
	};
