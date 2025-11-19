/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { client } from "@/config/apollo";
import * as IPages from "@/graphql/CMS/types/page";
import { ApolloClient, DocumentNode, gql } from "@apollo/client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX PAGES SLUGS (URLS) XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export const getAllPagesSlugs = async (): Promise<IPages.IProps | unknown> => {
	try {
		const content: DocumentNode = gql`
			{
				pages(where: {status: PUBLISH}, last: 100) {
					nodes {
						slug
						modified
					}
				}
			}
		`;

		const response: ApolloClient.QueryResult<IPages.IResponse> = await client.query<IPages.IResponse>({
			query: content,
		});

		return response?.data?.pages?.nodes;

	} catch (error: unknown) {
		console.log(error);
		throw new Error("Something went wrong trying to fetch all pages slugs");
	}
};
