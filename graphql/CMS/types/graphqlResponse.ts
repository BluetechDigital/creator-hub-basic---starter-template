/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX GLOBAL XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/* Minimal shape of a GraphQL-over-HTTP JSON response, used in place of
Apollo's ApolloClient.QueryResult<T> now that CMS queries are plain fetch()
calls (see ARCHITECTURE.md's "one folder per social platform" fetch/revalidate
convention, applied here too). */
export type IGraphQLResponse<T> = {
	data?: T;
	errors?: { message: string }[];
};
