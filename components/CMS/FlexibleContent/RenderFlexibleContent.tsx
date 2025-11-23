"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import usePageContext from "@/context/pages";
import * as IPage from "@/context/types/page";
import * as IFlexibleContent from "@/graphql/CMS/types/flexibleContent";
import { FC, memo, useMemo, Suspense, createElement, lazy, LazyExoticComponent } from 'react';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Change this map definition to allow any Lazy-loaded Functional Component.
// This resolves the assignment error at the definition point.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynamicComponentMap = Record<string, LazyExoticComponent<FC<any>>>;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX Dynamic Component Loaders XXXXXXXXXXXXXXXXXXXXXXXXXXXX
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
    AllYoutubeShortsVideos: lazy(() => import("@/components/CMS/AllYoutubeShortsVideos/AllYoutubeShortsVideos")),
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import SVGLoader from "@/components/CMS/FlexibleContent/fragments/SVGLoader";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX Flexible Content Component XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const RenderFlexibleContent: FC = memo(() => {
	const { memoizedValues } = usePageContext() as IPage.IContext;
	
    // Destructure for clarity
    const content = memoizedValues.content;
    const postTypeFlexibleContent = memoizedValues.postTypeFlexibleContent;

	// Memoize the Components Key Value Pairs
	const componentMapping: IFlexibleContent.IMapping = useMemo(() => {
		/* Generate the required ACF key 
		(e.g., 'DefaultTemplate_Flexiblecontent_FlexibleContent_Hero') 
		from the simple key ('Hero') */

		return Object.entries(DynamicComponentLoaders).reduce((acc, [key, Component]) => {

			acc[`${postTypeFlexibleContent}_${key}`] = Component as IFlexibleContent.IGenericComponentType;

			return acc;

		}, {} as IFlexibleContent.IMapping);

	}, [postTypeFlexibleContent]); // Recreate mapping only if postTypeFlexibleContent changes

	return (
        <Suspense fallback={<SVGLoader/>}>
			{content.map((item: IFlexibleContent.IProps[number], index: number) => {
            
                const Component = componentMapping[item.fieldGroupName];
                
                // Check component and displaySection status
                if (!Component || item.displaySection !== true) {
                    return null; // Skip rendering if component doesn't exist or is hidden
                }

                return (
                    // Use a key that is unlikely to change (fieldGroupName + index as fallback)
                    <section key={item.fieldGroupName + "-" + index}>
                        {createElement(Component, {
                            ...item,
                        })}
                    </section>
                );
            })}
        </Suspense>
	);
});

RenderFlexibleContent.displayName = 'RenderFlexibleContent';

export default RenderFlexibleContent;
