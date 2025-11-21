"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import usePageContext from "@/context/pages";
import * as IPage from "@/context/types/page";
import * as IFlexibleContent from "@/graphql/CMS/types/flexibleContent";
import { FC, memo, useMemo, Suspense, createElement } from 'react';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { DynamicComponentLoaders } from "@/components/CMS/FlexibleContent/dynamicComponentsImports";

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
        <Suspense fallback={<div>Loading component...</div>}>
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
