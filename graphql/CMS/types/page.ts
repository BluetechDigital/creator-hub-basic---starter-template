/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX PAGES XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export type IResponse = {
	pages: ({
        nodes: IProps[];
    } | null) | null;
};

export type IProps = {
	slug: string;
	modified: string;
};