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

/**
 * Registry of every CMS block component, keyed by its simple name (e.g. "Hero", "AboutUs")
 * — the same name that appears as the suffix of a block's ACF `fieldGroupName`. Each entry
 * is `React.lazy()`-loaded so a page only downloads the blocks it actually uses. Adding a
 * new block type means adding it here with a key that matches the ACF field group's simple
 * name exactly (see ARCHITECTURE.md §1) — the lookup below depends on that match, and
 * blockRegistration.test.ts guards against this map and the `components/CMS/` folders
 * drifting apart.
 */
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
    YoutubeVideoGrid: lazy(() => import("@/components/CMS/YouTubeVideoGrid/YouTubeVideoGrid")),
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

/**
 * Renders the flexible-content blocks for the current page in whatever order a CMS editor
 * arranged them in WordPress — the last step of the slug → rendered-blocks pipeline
 * described in ARCHITECTURE.md §1.
 *
 * Reads the page's block content array from PageContextProvider (via `usePageContext`),
 * then for each block:
 * 1. looks it up in `componentMapping`, keyed by the block's full ACF `fieldGroupName`
 *    (e.g. `DefaultTemplate_Flexiblecontent_FlexibleContent_Hero`). `componentMapping` is a
 *    `useMemo`'d reconstruction of `DynamicComponentLoaders` with each simple key
 *    re-prefixed with `${postTypeFlexibleContent}_`, recomputed only when
 *    `postTypeFlexibleContent` changes;
 * 2. skips the block entirely if no matching component is registered, or if the CMS editor
 *    toggled `displaySection` off;
 * 3. derives a CSS class name for the wrapping `<section>` by slicing the block's simple
 *    name off the end of `fieldGroupName` — everything after the last underscore — which is
 *    the same "strip the ACF prefix" idea as step 1, just done via substring/lastIndexOf
 *    instead of a known prefix length;
 * 4. renders the resolved component (via `createElement`, since its type is only known at
 *    runtime) inside a shared `<Suspense>` so each lazily-loaded block streams in
 *    independently instead of blocking the rest of the page.
 */
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

                /* Efficiently extract the component's simple name (e.g., 'Hero', or 'AboutUs' or 'CallToAction')
                by finding the index of the last underscore and slicing the string. Basically removing the long
                Advanced Custom Fields (ACF) component fieldGroupName (e.g., "DefaultTemplate_Flexiblecontent_FlexibleContent_Hero"). */
                const fieldGroupClassName = item.fieldGroupName.substring(item.fieldGroupName.lastIndexOf('_') + 1);

                return (
                    // Use a key that is unlikely to change (fieldGroupName + index as fallback)
                    <section className={fieldGroupClassName} key={item.fieldGroupName + "-" + index}>
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
