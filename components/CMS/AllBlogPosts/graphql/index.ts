/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXX GraphQL Fragments for AllBlogPosts ACF Component XXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// The exported string is the AllBlogPosts ACF field group's GraphQL fragment, spliced
// into the flexible-content query by getAllComponentsGrapghQLFragments. The actual post
// data is fetched separately via getAllPostsSummaries, not through this fragment.
//
// `title` (the archive header's dynamic heading) is confirmed live against the schema
// and machine-translated for non-English locales in RenderFlexibleContent.tsx's
// ResolvedBlock (see its PROSE_FIELDS allowlist) before it ever reaches AllBlogPosts.tsx.
export const AllBlogPosts = `
    fieldGroupName
    displaySection
    title
`;
