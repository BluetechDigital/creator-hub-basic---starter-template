/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX PAGES XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export type IResponse = {
	pages: ({
        nodes: IProps[];
    } | null) | null;
};

/** A single published page's slug and last-modified date, as returned by `getAllPagesSlugs`. */
export type IProps = {
	slug: string;
	modified: string;
};