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

/**
 * Fetches the site-wide "Global Content" theme options (contact details,
 * social links, error-page content, etc.) from the CMS's ACF options page.
 * The options page is matched by a hardcoded `where: {name: "Global Content"}`
 * string, not by ID — if that page is ever renamed in the CMS, this query will
 * silently return no matching edges instead of erroring.
 * Note: the fields fetched here don't fully line up with `IThemesOptions.IProps`
 * in `graphql/CMS/types/themesOptions.ts` — this query fetches `lineLink`,
 * `whatsappLink`, and `wechatLink` (not declared on `IProps`), while `IProps`
 * declares `youtubeLink`, `instagramLink`, and `textarea` (not fetched here).
 * Don't assume `IProps` is a complete/accurate contract for this response shape.
 * @returns A promise resolving to the theme options fields object, or `undefined` on failure.
 */
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

			if (response.errors) {
				console.error("Theme options query returned errors:", response.errors);
				return undefined;
			}

			return response?.data?.themeOptions?.edges?.[0]?.node?.themeOptions;

		} catch (error: unknown) {
			console.log(error);
			throw new Error(
				"Something went wrong trying to fetch themes options content"
			);
		}
	};
