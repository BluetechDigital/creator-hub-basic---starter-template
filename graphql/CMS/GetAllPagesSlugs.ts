/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IPages from "@/graphql/CMS/types/page";
import { IGraphQLResponse } from "@/graphql/CMS/types/graphqlResponse";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const GRAPHQL_ENDPOINT: string | undefined = process.env.NEXT_PUBLIC_CMS_API_URL;
if (!GRAPHQL_ENDPOINT) throw new Error("NEXT_PUBLIC_CMS_API_URL not defined.");

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX PAGES SLUGS (URLS) XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Fetches the slug and last-modified date of every published page, used by
 * `app/sitemap.ts` to build the site's sitemap. The query caps results at
 * `last: 100` with no pagination/cursor handling — sites with more than 100
 * published pages will have the excess silently excluded from the sitemap.
 * @returns A promise resolving to the array of `{ slug, modified }` nodes, or `undefined` on failure.
 */
export const getAllPagesSlugs = async (): Promise<IPages.IProps | unknown> => {
	try {
		const content = `
			{
				pages(where: {status: PUBLISH}, last: 100) {
					nodes {
						slug
						modified
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
			console.error(`Pages slugs fetch failed with status: ${nextJSFetchResponse.status}`);
			return undefined;
		}

		const response: IGraphQLResponse<IPages.IResponse> = await nextJSFetchResponse.json();

		if (response.errors) {
			console.error("Pages slugs query returned errors:", response.errors);
			return undefined;
		}

		return response?.data?.pages?.nodes;

	} catch (error: unknown) {
		console.log(error);
		throw new Error("Something went wrong trying to fetch all pages slugs");
	}
};
