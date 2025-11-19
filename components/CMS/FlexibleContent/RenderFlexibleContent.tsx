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
	const componentMapping: IFlexibleContent.IMapping = useMemo(() => {
		
        const mapping: IFlexibleContent.IMapping = {
            [`${postTypeFlexibleContent}_TitleParagraph`]: TitleParagraph as IFlexibleContent.IGenericComponentType,
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
