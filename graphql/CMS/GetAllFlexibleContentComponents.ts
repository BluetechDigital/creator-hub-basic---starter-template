/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { client } from "@/config/apollo";
import { ApolloClient, DocumentNode, gql } from "@apollo/client";
import * as IFlexibleContent from "@/graphql/CMS/types/flexibleContent";
import { 
    getAllComponentsGrapghQLFragments, // The MAP of loader functions
    allComponentsGrapghQLFragmentsObjectKeys // The ARRAY of keys
} from "@/graphql/CMS/GetAllComponentsFragments";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/* Apollo Client URL (You'll need this to use fetch) */
const GRAPHQL_ENDPOINT: string | undefined = process.env.NEXT_PUBLIC_CMS_API_URL;
if (!GRAPHQL_ENDPOINT) throw new Error("NEXT_PUBLIC_CMS_API_URL not defined.");

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXX 1. START: GET ALL COMPONENTS NAMES TO QUERY THE CMS FOR 
ONLY THE COMPONENTS USED FOR THE CURRENT ${SLUG} PAGE XXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Executes a lightweight GraphQL query to retrieve the field group names 
 * (component types) used on a specific page/post slug.
 * * @param slug The slug of the page or post to query.
 * @param postType The post type (e.g., 'page', 'post').
 * @param postTypeFlexibleContent The ACF type prefix (e.g., 'Page', 'Post').
 * @returns A promise that resolves to the raw GraphQL response object, or null on error.
 */

const getAllComponentFieldGroupNames = async (
    slug: string,
    postType: string,
    postTypeFlexibleContent: string
): Promise<ApolloClient.QueryResult<IFlexibleContent.IQueryResponse> | []> => {

    /* -----------------------------------------------------------------------------
		XXXXXXXXXXXXXXXXXXXXXXXX 1. START: GET ALL COMPONENTS NAMES TO QUERY THE CMS FOR 
		ONLY THE COMPONENTS USED FOR THE CURRENT ${SLUG} PAGE XXXXXXXXXXXXXXXXXXXXXXXXX
		----------------------------------------------------------------------------- */

		/* Build the lightweight fragment string to ensure we pull the 
		fieldGroupName for every possible acf blocks. */
		const lightFragmentStrings = allComponentsGrapghQLFragmentsObjectKeys
			.map(name => `... on ${postTypeFlexibleContent}_${name} { fieldGroupName }`)
			.join('\n');

		const getPagefieldGroupNameListQuery = `
			{
				flexibleComponents: ${postType}(where: {name: "${slug}", status: PUBLISH}) {
					edges {
						node {
							template {
								... on DefaultTemplate {
									flexibleContent {
										flexibleContent {
											${lightFragmentStrings} 
										}
									}
								}
							}
						}
					}
				}
			}
		`;

		/* Execute the query using Next.js native fetch caching.
        For better caching performance */
		const nextJSFetchResponse: Response = await fetch(GRAPHQL_ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query: getPagefieldGroupNameListQuery }),
			// 🎯 OPTIMIZATION: Cache for 24 hours (86400 seconds)
			next: { revalidate: 86400 }
		});
        
        /* Check for network errors immediately */
        if (!nextJSFetchResponse.ok) {
            console.error(`Pass 1 fetch failed with status: ${nextJSFetchResponse.status}`);
            return [];
		}
		
		/* FIX 2: Correctly type the raw JSON response from fetch */
		const fieldGroupNameListQueryResponse: ApolloClient.QueryResult<IFlexibleContent.IQueryResponse> = await nextJSFetchResponse.json();
	
    return fieldGroupNameListQueryResponse as ApolloClient.QueryResult<IFlexibleContent.IQueryResponse>;
};


/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXX 2. PROCESS ARRAY: Extract unique component names XXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Processes the raw GraphQL response to extract and filter the unique component 
 * names (e.g., 'Hero', 'ImageGallery') actually used on the page.
 * * @param fieldGroupNameListQueryResponse The raw JSON response from the Pass 1 query.
 * @returns An array of unique component name strings, or an empty array if none are found.
 */
const extractActiveComponentNames = (
    fieldGroupNameListQueryResponse: ApolloClient.QueryResult<IFlexibleContent.IQueryResponse>
): string[] => {
    
    /* Extract unique component names (e.g. DefaultTemplate_Flexiblecontent_FlexibleContent_{ComponentName}) */
		const fieldGroupNameStructureArray: { fieldGroupName: string }[] | undefined = fieldGroupNameListQueryResponse.data?.flexibleComponents?.edges?.[0].node.template.flexibleContent.flexibleContent;
		
		if (!fieldGroupNameStructureArray || fieldGroupNameStructureArray.length === 0) {
			return []; // Exit early
		}
		
		/* Extract component name from ACF field group name 
		(e.g., 'DefaultTemplate_Flexiblecontent_FlexibleContent_Hero' -> 'Hero') */
		const activeComponentNamesArray = fieldGroupNameStructureArray
			.map(item => item.fieldGroupName.split('_').pop())
			.filter((name: string | undefined, index: number, self: (string | undefined)[]) => 
                name && 
			self.indexOf(name) === index && 
			allComponentsGrapghQLFragmentsObjectKeys.includes(name) // Ensure we only process known component keys
		);
		
		if (activeComponentNamesArray.length === 0) {
			return [];
		}
	
	return activeComponentNamesArray as string[];
};


/* -----------------------------------------------------------------------------
XXXXX 3. getAllFlexibleContentComponents: Orchestrator and Optimized Pass 2 Query XXXXX
----------------------------------------------------------------------------- */

/**
 * Main function to retrieve all ACF Flexible Content components for a given page/post slug.
 * This function orchestrates the two-pass query optimization:
 * 1. Executes a lightweight query to determine which components are active.
 * 2. Executes an optimized query fetching data only for those active components.
 * * @param slug The slug of the page or post to fetch content for.
 * @param postType The WP post type (e.g., 'pages', 'posts').
 * @param postTypeFlexibleContent The ACF type name prefix (e.g., 'Page', 'Post').
 * @returns A promise that resolves to the array of flexible content components (IProps) or null on failure.
 */
export const getAllFlexibleContentComponents = async (
	slug: string,
	postType: string,
	postTypeFlexibleContent: string,

): Promise<IFlexibleContent.IProps | unknown> => {
	try {
		
		/* -------------------------------------------------------------------------
        XXXXXXXXXXXX Step A: Execute Pass 1: Get raw field group names XXXXXXXXXXXXX
        ------------------------------------------------------------------------- */

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const rawResponse: ApolloClient.QueryResult<IFlexibleContent.IQueryResponse> | any = await getAllComponentFieldGroupNames(
            slug, 
            postType, 
            postTypeFlexibleContent
        );

        if (!rawResponse) {
            console.log(`Failed to fetch raw component names for slug: ${slug}.`);
            return null;
        }

		/* -------------------------------------------------------------------------
        XXXXXXX Step B: Process Pass 1 data: Extract unique component names XXXXXXXX
        ------------------------------------------------------------------------- */

		const activeComponentNamesArray = extractActiveComponentNames(rawResponse);

        if (activeComponentNamesArray.length === 0) {
            console.log(`No active or recognized flexible content components found for slug: ${slug}`);
            return null;
        }

		/* -------------------------------------------------------------------------
        XXXXXXXX Step C: Construct and Execute Pass 2: The optimized query XXXXXXXXX
        ------------------------------------------------------------------------- */

		/* Construct the final, optimized GraphQL query Dynamically import only 
		the GraphQL fragments for the used components */
		const fragmentPromises = activeComponentNamesArray
			.map(name => getAllComponentsGrapghQLFragments[name!]());
		
		const loadedModules = await Promise.all(fragmentPromises);

		/* Build the final, optimized fragment string */
		const currentOptimizedPageFragmentStrings = loadedModules
			.map((mod, index: number) => {
				const componentName = activeComponentNamesArray[index];
				
				/* Assuming the GraphQL fragment string is exported under the same name as the component */
				const fragmentContent = mod[componentName!];
				return `... on ${postTypeFlexibleContent}_${componentName} {${fragmentContent}}`;
			})
			.join('\n');
		
		const content: DocumentNode = gql`
			{
        		flexibleComponents: ${postType}(where: {name: "${slug}", status: PUBLISH}) {
        		  edges {
						node {
							template {
								... on DefaultTemplate {
									flexibleContent {
										flexibleContent {
											${currentOptimizedPageFragmentStrings}
										}
									}
								}
							}
						}
					}
        		}
			}
		`;

		const response: ApolloClient.QueryResult<IFlexibleContent.IQueryResponse> = await client.query<IFlexibleContent.IQueryResponse>({
			query: content,
		});

		// 1. Check for data and errors
        if (!response.data || response.error) {
            console.error("GraphQL query failed or returned data errors.", response.error);
            return null;
		}
		
		// 2. Safely extract the deep array structure
        const flexibleContentArray = 
            response.data.flexibleComponents?.edges?.[0]?.node?.template?.flexibleContent?.flexibleContent;

		// 3. Check if content was actually retrieved
        if (!flexibleContentArray) {
            console.log(`No flexible content found for slug: ${slug}`);
            return null;
		}

		return flexibleContentArray as IFlexibleContent.IProps;

	} catch (error) {
		console.log(error);
		throw new Error("Something went wrong trying to fetch all flexible content components");
	}
};