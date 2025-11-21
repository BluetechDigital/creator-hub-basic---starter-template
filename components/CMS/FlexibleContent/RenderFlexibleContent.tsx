"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import usePageContext from "@/context/pages";
import * as IPage from "@/context/types/page";
import React, { FC, memo, useMemo, Fragment } from "react";
import * as IFlexibleContent from "@/graphql/CMS/types/flexibleContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import Hero from "@/components/CMS/Hero/Hero";
import HeroTwo from "@/components/CMS/HeroTwo/HeroTwo";
import AboutUs from "@/components/CMS/AboutUs/AboutUs";
import ContactForm from "@/components/CMS/ContactForm/ContactForm";
import CallToAction from "@/components/CMS/CallToAction/CallToAction";
import InstagramFeed from "@/components/CMS/InstagramFeed/InstagramFeed";
import CookiePolicies from "@/components/CMS/CookiePolicies/CookiePolicies";
import TitleParagraph from "@/components/CMS/TitleParagraph/TitleParagraph";
import CallToActionTwo from "@/components/CMS/CallToActionTwo/CallToActionTwo";
import PrivacyPolicies from "@/components/CMS/PrivacyPolicies/PrivacyPolicies";
import SponsorshipInfo from "@/components/CMS/SponsorshipInfo/SponsorshipInfo";
import YoutubeVideoGrid from "@/components/CMS/YoutubeVideoGrid/YoutubeVideoGrid";
import AllYoutubeVideos from "@/components/CMS/AllYoutubeVideos/AllYoutubeVideos";
import AllYoutubeShortsVideos from "@/components/CMS/AllYoutubeShortsVideos/AllYoutubeShortsVideos";

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
		
        const mapping: IFlexibleContent.IMapping = {
            [`${postTypeFlexibleContent}_Hero`]: Hero as IFlexibleContent.IGenericComponentType,
            [`${postTypeFlexibleContent}_HeroTwo`]: HeroTwo as IFlexibleContent.IGenericComponentType,
            [`${postTypeFlexibleContent}_AboutUs`]: AboutUs as IFlexibleContent.IGenericComponentType,
            [`${postTypeFlexibleContent}_ContactForm`]: ContactForm as IFlexibleContent.IGenericComponentType,
            [`${postTypeFlexibleContent}_CallToAction`]: CallToAction as IFlexibleContent.IGenericComponentType,
            [`${postTypeFlexibleContent}_InstagramFeed`]: InstagramFeed as IFlexibleContent.IGenericComponentType,
            [`${postTypeFlexibleContent}_CookiePolicies`]: CookiePolicies as IFlexibleContent.IGenericComponentType,
            [`${postTypeFlexibleContent}_TitleParagraph`]: TitleParagraph as IFlexibleContent.IGenericComponentType,
            [`${postTypeFlexibleContent}_CallToActionTwo`]: CallToActionTwo as IFlexibleContent.IGenericComponentType,
            [`${postTypeFlexibleContent}_PrivacyPolicies`]: PrivacyPolicies as IFlexibleContent.IGenericComponentType,
            [`${postTypeFlexibleContent}_SponsorshipInfo`]: SponsorshipInfo as IFlexibleContent.IGenericComponentType,
            [`${postTypeFlexibleContent}_YoutubeVideoGrid`]: YoutubeVideoGrid as IFlexibleContent.IGenericComponentType,
            [`${postTypeFlexibleContent}_AllYoutubeVideos`]: AllYoutubeVideos as IFlexibleContent.IGenericComponentType,
            [`${postTypeFlexibleContent}_AllYoutubeShortsVideos`]: AllYoutubeShortsVideos as IFlexibleContent.IGenericComponentType,
        };

        return mapping;
        
    }, [postTypeFlexibleContent]); // Recreate mapping only if postTypeFlexibleContent changes

	return (
        <>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {content.map((item: any, index: number) => (
				<Fragment key={item.fieldGroupName || index}>
					{item.displaySection === true ? (
						<section>
							{componentMapping[item.fieldGroupName] && (
								<>
									{React.createElement(componentMapping[item.fieldGroupName], {
										...item,
									})}
								</>
							)}
						</section>
					) : (null )}
				</Fragment>
			))}
        </>
	);
});

RenderFlexibleContent.displayName = 'RenderFlexibleContent';

export default RenderFlexibleContent;
