/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXX LINKS AND SUBLINKS TYPES XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export type ILinksArray = {
	node: {
		id: string;
		url: string;
		label: string;
	};
}[];

export type IResponse = {
	menuLinks: {
        edges: Array<{
            node: ILinksArray;
        } | null> | null;
    } | null;
} | null;

export type IMobileLinks = ILinksArray;
export type ICopyrightLinks = ILinksArray;
export type INavbarMenuLinks = ILinksArray;
export type IFooterMenuLinks = ILinksArray;