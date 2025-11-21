/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { HttpLink } from "@apollo/client";
import { ApolloClient, InMemoryCache } from "@apollo/client";

/* -----------------------------------------------------------------------------
XXXXXXXXXX Merges existing and incoming data to prevent overwriting XXXXXXXXXXXX
----------------------------------------------------------------------------- */

const customMergeFunction = (existing: Record<string, unknown>, incoming: Record<string, unknown>) => {
	// Your logic to merge the existing and incoming data goes here
	// Make sure to return the merged data

	// If there is no existing data, simply return the incoming data
	if (!existing) {
		return incoming;
	}

	// Merge the fields from the existing and incoming data
	const mergedData: unknown = {
		// ...existing,
		...incoming,
	};

	// Perform any additional merging or custom logic based on your data structure
	// For example, if there are nested fields within the post object,
	// you may need to merge them separately or apply specific rules.
	// Modify this part according to your data structure and merging requirements.

	// Return the merged data
	return mergedData;
};

/* -----------------------------------------------------------------------------
XXXXXXXX Initialize the Apollo Client with custom cache configuration XXXXXXXXXX
----------------------------------------------------------------------------- */

const cache: InMemoryCache = new InMemoryCache({
	typePolicies: {
		Query: {
			fields: {
				post: {
					merge: customMergeFunction,
				},
				page: {
					merge: customMergeFunction,
				},
			},
		},
	},
});

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXX Export the configured Apollo Client XXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export const client: ApolloClient = new ApolloClient({
	link: new HttpLink({ uri: `${process.env.NEXT_PUBLIC_CMS_API_URL}` }),
	cache: cache,
});
