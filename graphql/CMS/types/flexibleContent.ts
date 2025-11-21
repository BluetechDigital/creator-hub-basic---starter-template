/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX GLOBAL XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
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

// Define the full base props (with the permissive index signature)
export type IBaseFlexibleContentProps = {
    __typename: string;
    fieldGroupName: string;
    displaySection?: boolean;
    [key: string]: unknown; 
};

// New Utility Type: Extract only the fields we explicitly named.
export type IBaseFixedProps = Pick<
    IBaseFlexibleContentProps, 
    '__typename' | 'fieldGroupName' | 'displaySection'
>;

/* Represents an array structure for rich content ACF blocks. */
// 2. IProps is the ARRAY of the base prop objects
export type IProps = IBaseFlexibleContentProps[]; 

/* Generic component type for flexible content components */
// 3. IGenericComponentType is a COMPONENT that takes the BASE PROP OBJECT
export type IGenericComponentType = React.ComponentType<IBaseFlexibleContentProps>;

/* Mapping type for flexible content components */
export type IMapping = {
    [key: string]: IGenericComponentType;
};
