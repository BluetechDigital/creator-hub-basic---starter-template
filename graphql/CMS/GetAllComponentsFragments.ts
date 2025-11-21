/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/* The key is the component name (used to build the ACF field group name)
 The value is a function that returns the imported fragment (a Promise).  */
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
    YoutubeVideoGrid: () => import("@/components/CMS/YoutubeVideoGrid/graphql/index"),
    AllYoutubeVideos: () => import("@/components/CMS/AllYoutubeVideos/graphql/index"),
};

// Exporting the list of all keys is useful for mapping/filtering
export const allComponentsGrapghQLFragmentsObjectKeys = Object.keys(getAllComponentsGrapghQLFragments);