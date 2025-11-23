/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { ApolloClient} from "@apollo/client";
import * as IFlexibleContent from "@/graphql/CMS/types/flexibleContent";
import { allComponentsGrapghQLFragmentsObjectKeys } from "@/graphql/CMS/GetAllComponentsGraphQLFragments";

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

export const getAllComponentFieldGroupNames = async (
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
export const extractActiveComponentNames = (
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