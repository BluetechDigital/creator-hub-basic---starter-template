/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX GLOBAL XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */
/* Define the structure of the response from the CMS for flexible content components */
export type IQueryResponse = {
        flexibleComponents: {
                edges: {
                        node: {
                                template: { 
                                     flexibleContent: {
                                             flexibleContent: {
                                                     __typename: string;
                                             }[];
                                     };   
                                };
                        };
                }[];
        };
};

/* Represents an array structure for rich content ACF blocks.
 The inner 'content: any' is deliberately simplified here. */
export type IProps = {
        __typename: string;
}[];