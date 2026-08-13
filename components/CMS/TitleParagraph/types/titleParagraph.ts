/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IFlexibleContent from "@/graphql/CMS/types/flexibleContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export type IProps = IFlexibleContent.IBaseFixedProps & {
    title: string;
    paragraph: string;
    // Misleading name: this does NOT toggle the paragraph's visibility. It controls text
    // ALIGNMENT — true centers the paragraph at every breakpoint, false centers it on
    // mobile but left-aligns it on large screens. See TitleParagraph.tsx.
    displayParagraph: boolean;
};