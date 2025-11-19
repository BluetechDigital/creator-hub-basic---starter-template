/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as ILinks from "@/graphql/CMS/types/links";
import * as IThemesOptions from "@/graphql/CMS/types/themesOptions";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX GLOBAL XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/* GLOBAL: Project Props, Content & Content Provider Interface */
export type IProps = {
    // Custom Post Types
    themesOptionsContent: IThemesOptions.IProps;

    // Website Links
    mobileLinks: ILinks.IMobileLinks;
    copyrightLinks: ILinks.ICopyrightLinks;
    navbarMenuLinks: ILinks.INavbarMenuLinks;
    footerMenuLinks: ILinks.IFooterMenuLinks;
};

export type IContext = IProps;

export type IContextProvider = {
    globalProps: IProps;
    children: React.ReactNode;
};