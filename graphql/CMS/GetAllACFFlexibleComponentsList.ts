/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IFlexibleContent from "@/graphql/CMS/types/flexibleContent";
import { IGraphQLResponse } from "@/graphql/CMS/types/graphqlResponse";
import { allComponentsGrapghQLFragmentsObjectKeys } from "@/graphql/CMS/GetAllComponentsGraphQLFragments";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const GRAPHQL_ENDPOINT: string | undefined = process.env.NEXT_PUBLIC_CMS_API_URL;
if (!GRAPHQL_ENDPOINT) throw new Error("NEXT_PUBLIC_CMS_API_URL not defined.");

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXX 1. START: GET ALL COMPONENTS NAMES TO QUERY THE CMS FOR 
ONLY THE COMPONENTS USED FOR THE CURRENT ${SLUG} PAGE XXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Executes a lightweight GraphQL query to retrieve the field group names
 * (component types) used on a specific page/post slug.
 *
 * `slug` is passed as a `$slug` GraphQL variable, not interpolated into the
 * query string — it comes straight from the URL's route param, so a raw
 * `where: {name: "${slug}"}` interpolation would let a crafted slug break
 * out of the string literal and inject arbitrary GraphQL syntax. `postType`
 * is still interpolated directly (as the root field name), which is safe
 * since every call site passes one of this codebase's own `postType`
 * constants, never external input.
 * @param slug The slug of the page or post to query.
 * @param postType The post type (e.g., 'page', 'post').
 * @param postTypeFlexibleContent The ACF type prefix (e.g., 'Page', 'Post').
 * @returns A promise that resolves to the raw GraphQL response object, or an empty array on HTTP/GraphQL error.
 */

export const getAllComponentFieldGroupNames = async (
    slug: string,
    postType: string,
    postTypeFlexibleContent: string
): Promise<IGraphQLResponse<IFlexibleContent.IQueryResponse> | []> => {

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
            query GetFieldGroupNames($slug: String!) {
                flexibleComponents: ${postType}(where: {name: $slug, status: PUBLISH}) {
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
            body: JSON.stringify({ query: getPagefieldGroupNameListQuery, variables: { slug } }),
            // 🎯 OPTIMIZATION: Cache for 24 hours (86400 seconds)
            next: { revalidate: 86400 }
        });
        
        /* Check for network errors immediately */
        if (!nextJSFetchResponse.ok) {
            console.error(`Pass 1 fetch failed with status: ${nextJSFetchResponse.status}`);
            return [];
        }
        
        const fieldGroupNameListQueryResponse: IGraphQLResponse<IFlexibleContent.IQueryResponse> = await nextJSFetchResponse.json();

        /* A 200 OK HTTP response can still carry GraphQL-level validation errors (e.g. a
        field that doesn't exist on the schema) with `data` left empty — check for that
        separately from the HTTP-level check above, so a bad query fails loudly here
        instead of surfacing later as a confusing downstream crash. */
        if (fieldGroupNameListQueryResponse.errors) {
            console.error("Pass 1 GraphQL query returned errors:", fieldGroupNameListQueryResponse.errors);
            return [];
        }

    return fieldGroupNameListQueryResponse;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXX 2. PROCESS ARRAY: Extract unique component names XXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Processes the raw GraphQL response to extract and filter the unique component
 * names (e.g., 'Hero', 'ImageGallery') actually used on the page.
 * @param fieldGroupNameListQueryResponse The raw JSON response from the Pass 1 query.
 * @returns An array of unique component name strings, or an empty array if none are found.
 */
export const extractActiveComponentNames = (
    fieldGroupNameListQueryResponse: IGraphQLResponse<IFlexibleContent.IQueryResponse> | []
): string[] => {
    
    /* Extract unique component names (e.g. DefaultTemplate_Flexiblecontent_FlexibleContent_{ComponentName}) */
        const fieldGroupNameStructureArray: { fieldGroupName: string }[] | undefined = Array.isArray(fieldGroupNameListQueryResponse)
            ? undefined
            : fieldGroupNameListQueryResponse.data?.flexibleComponents?.edges?.[0]?.node.template.flexibleContent.flexibleContent;
        
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