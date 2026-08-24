/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXX GraphQL Fragments for AllBlogPosts ACF Component XXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// The exported string is the AllBlogPosts ACF field group's GraphQL fragment, spliced
// into the flexible-content query by getAllComponentsGrapghQLFragments. The actual post
// data is fetched separately via getAllPostsSummaries, not through this fragment.
//
// TODO: add the archive header's `title` field here once it exists in WordPress and its
// exact ACF GraphQL field name is confirmed — do NOT guess it. Querying a field that
// doesn't exist in the schema fails the *entire* flexible-content request for every block
// on the page, not just this one (confirmed the hard way earlier in this project — see
// git history), so this stays out until the name is verified against the live schema.
// `components/CMS/AllBlogPosts/types/allBlogPosts.ts`'s `title` prop is already wired to
// receive it the moment this fragment adds it.
export const AllBlogPosts = `
    fieldGroupName
    displaySection
    title
`;
