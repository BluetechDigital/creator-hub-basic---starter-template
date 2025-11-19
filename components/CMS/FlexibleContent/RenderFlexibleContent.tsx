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

import TitleParagraph from "@/components/CMS/TitleParagraph/TitleParagraph";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX Flexible Content Component XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const RenderFlexibleContent: FC = memo(() => {
	const { memoizedValues } = usePageContext() as IPage.IContext;
	
    // Destructure for clarity
    const content = memoizedValues.content;
    const postTypeFlexibleContent = memoizedValues.postTypeFlexibleContent;

	// Memoize the Components Key Value Pairs
	const componentMapping = useMemo(() => {
		const mapping: IFlexibleContent.IMapping = {
            [`${postTypeFlexibleContent}_TitleParagraph`]: TitleParagraph as IFlexibleContent.IGenericComponentType,
        };
        return mapping as IFlexibleContent.IMapping;
        
    }, [postTypeFlexibleContent]); // Recreate mapping only if postTypeFlexibleContent changes
    

	return (
		<>
        </>
	);
});

RenderFlexibleContent.displayName = 'RenderFlexibleContent';

export default RenderFlexibleContent;
