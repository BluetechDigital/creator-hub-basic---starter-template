/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { lazy, LazyExoticComponent, FC } from 'react';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Change this map definition to allow any Lazy-loaded Functional Component.
// This resolves the assignment error at the definition point.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynamicComponentMap = Record<string, LazyExoticComponent<FC<any>>>;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export const DynamicComponentLoaders: DynamicComponentMap = {
    Hero: lazy(() => import("@/components/CMS/Hero/Hero")),
    HeroTwo: lazy(() => import("@/components/CMS/HeroTwo/HeroTwo")),
    AboutUs: lazy(() => import("@/components/CMS/AboutUs/AboutUs")),
    ContactForm: lazy(() => import("@/components/CMS/ContactForm/ContactForm")),
    CallToAction: lazy(() => import("@/components/CMS/CallToAction/CallToAction")),
    InstagramFeed: lazy(() => import("@/components/CMS/InstagramFeed/InstagramFeed")),
    CookiePolicies: lazy(() => import("@/components/CMS/CookiePolicies/CookiePolicies")),
    TitleParagraph: lazy(() => import("@/components/CMS/TitleParagraph/TitleParagraph")),
    CallToActionTwo: lazy(() => import("@/components/CMS/CallToActionTwo/CallToActionTwo")),
    PrivacyPolicies: lazy(() => import("@/components/CMS/PrivacyPolicies/PrivacyPolicies")),
    SponsorshipInfo: lazy(() => import("@/components/CMS/SponsorshipInfo/SponsorshipInfo")),
    YoutubeVideoGrid: lazy(() => import("@/components/CMS/YoutubeVideoGrid/YoutubeVideoGrid")),
    AllYoutubeVideos: lazy(() => import("@/components/CMS/AllYoutubeVideos/AllYoutubeVideos")),
};