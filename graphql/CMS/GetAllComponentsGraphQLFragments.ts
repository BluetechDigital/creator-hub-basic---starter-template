/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXX Get All Components GrapghQL Fragments XXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Map of every registered flexible-content component to a lazy loader for its
 * GraphQL fragment module. The key is the component's simple name, matching
 * the suffix of the ACF field group name returned by the CMS (e.g.
 * `DefaultTemplate_Flexiblecontent_FlexibleContent_Hero` -> `"Hero"`). The
 * value is a dynamic `import()` rather than a static import so that only the
 * fragments for components actually used on a given page get code-split into
 * that page's bundle, instead of bundling every possible block's GraphQL
 * fragment into every page.
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const getAllComponentsGrapghQLFragments: Record<string, () => Promise<any>> = {
    Hero: () => import("@/components/CMS/Hero/graphql/index"),
    HeroTwo: () => import("@/components/CMS/HeroTwo/graphql/index"),
    AboutUs: () => import("@/components/CMS/AboutUs/graphql/index"),
    ContactForm: () => import("@/components/CMS/ContactForm/graphql/index"),
    CallToAction: () => import("@/components/CMS/CallToAction/graphql/index"),
    InstagramFeed: () => import("@/components/CMS/InstagramFeed/graphql/index"),
    CookiePolicies: () => import("@/components/CMS/CookiePolicies/graphql/index"),
    TitleParagraph: () => import("@/components/CMS/TitleParagraph/graphql/index"),
    CallToActionTwo: () => import("@/components/CMS/CallToActionTwo/graphql/index"),
    PrivacyPolicies: () => import("@/components/CMS/PrivacyPolicies/graphql/index"),
    SponsorshipInfo: () => import("@/components/CMS/SponsorshipInfo/graphql/index"),
    YoutubeVideoGrid: () => import("@/components/CMS/YouTubeVideoGrid/graphql/index"),
    AllYoutubeVideos: () => import("@/components/CMS/AllYoutubeVideos/graphql/index"),
    AllYoutubeShortsVideos: () => import("@/components/CMS/AllYoutubeShortsVideos/graphql/index"),
};

/**
 * The canonical, single-source-of-truth list of valid/recognized component
 * names, derived from the keys of `getAllComponentsGrapghQLFragments`. Used
 * elsewhere (e.g. `extractActiveComponentNames` in
 * `GetAllACFFlexibleComponentsList.ts`) to validate and filter which
 * component names reported by the CMS are actually known/renderable.
 */
export const allComponentsGrapghQLFragmentsObjectKeys = Object.keys(getAllComponentsGrapghQLFragments);