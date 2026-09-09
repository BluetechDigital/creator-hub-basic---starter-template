/* -----------------------------------------------------------------------------
XXXXXXXXXXXXX GraphQL Fragments for InstagramFeed ACF Component XXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// The exported string is the InstagramFeed ACF field group's GraphQL fragment, spliced
// into the flexible-content query by getAllComponentsGrapghQLFragments.
// NOTE: no "title" field here yet — the InstagramFeed ACF field group in
// WordPress doesn't have one defined. Add it there first (matching
// TitleParagraph's "title" field), then re-add it here — until then this MUST
// stay in sync with what the WP field group actually exposes, since every
// active block's fragment is joined into one combined query for the whole
// page and a single unknown field fails that entire query, not just this block.
export const InstagramFeed = `
    fieldGroupName
    displaySection
`;