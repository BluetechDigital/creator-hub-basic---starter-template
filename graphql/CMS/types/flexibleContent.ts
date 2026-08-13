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

/**
 * Full base shape shared by every ACF flexible-content block. The permissive
 * `[key: string]: unknown` index signature acts as an escape hatch for CMS
 * fields that haven't been explicitly typed yet, so new/unmapped ACF fields
 * don't break the type until someone adds them here explicitly.
 */
export type IBaseFlexibleContentProps = {
    __typename: string;
    fieldGroupName: string;
    displaySection?: boolean;
    [key: string]: unknown; 
};

/**
 * The subset of `IBaseFlexibleContentProps` guaranteed to exist on every
 * flexible-content block, regardless of its specific (untyped) fields.
 */
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
