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
                                             flexibleContent: IProps;
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
        fieldGroupName: string;
        displaySection?: boolean;
        [key: string]: unknown;
}[];

/* Mapping type for flexible content components */
export type IMapping = {
    [key: string]: IGenericComponentType;
};

/* Generic component type for flexible content components */
export type IGenericComponentType = React.ComponentType<Record<string, unknown>>;