/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXX GraphQL Fragments for AllBlogPosts ACF Component XXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// The exported string is the AllBlogPosts ACF field group's GraphQL fragment, spliced
// into the flexible-content query by getAllComponentsGrapghQLFragments. The block
// carries no ACF fields of its own — the actual post data is fetched separately via
// getAllPostsSummaries, not through this fragment.
export const AllBlogPosts = `
    fieldGroupName
    displaySection
`;
