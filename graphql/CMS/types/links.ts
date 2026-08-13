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

/**
 * Response shape for menu-link queries. Nullable at every level (`menuLinks`,
 * `edges`, and each edge) to mirror WPGraphQL's nullable-by-default field
 * convention — any of these can come back `null` even on an otherwise
 * successful query, so callers must optional-chain all the way down.
 */
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