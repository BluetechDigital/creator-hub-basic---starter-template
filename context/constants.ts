/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IPost from "@/context/types/post";
import * as IPage from "@/context/types/page";
import * as IFlexibleContentType from "@/context/types/flexibleContentType";
import * as ILocale from "@/context/types/locale";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXX PUBLIC PAGES & POSTS & PREVIEW PAGES & POSTS XXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */
// Post Types
// WPGraphQL post-type slugs: `pages`/`posts` are the public WordPress post types queried
// for live content; `previewPage`/`previewPost` (singular "page"/"post") are the post
// types WPGraphQL uses when resolving a single preview node.
export const postType: IPost.ITypes = {
    // Public pages
    pages: "pages",
	posts: "posts",

    // Preview pages
    previewPage: "page",
    previewPost: "post",
};

// Preview pages
// `home` maps to the WordPress page title/slug used to identify the home page when
// querying content for `app/page.tsx`.
export const pageType: IPage.ITypes = {
    // Public pages
    home: "Home",
    // The WP Page (not the "posts" post type) that hosts the blog archive — its slug
    // must match the ACF-composed archive page in WordPress exactly, the same way
    // `home` does for the home page. Not to be confused with `postType.posts` below,
    // which is the WP post type queried for the actual blog posts themselves.
    // Confirmed against the live CMS: the archive page is titled "Posts" (slug "posts").
    posts: "Posts",
    // The WP Page that hosts the YouTube video archive (`app/[locale]/videos/`), same shape as
    // `posts` above. WPGraphQL's `where: {name: $slug}` sanitizes this value before
    // matching it against the page's actual slug (confirmed live — `where:
    // {name: "Posts"}` and `where: {name: "posts"}` both match the same page), so exact
    // capitalization here doesn't matter; what has to match is the page's real WordPress
    // slug/permalink.
    videos: "Videos",
};

// Preview pages
// These values are ACF `fieldGroupName` prefixes on the WPGraphQL side — each string is
// the flexible-content field group name for its post type/template, used to build the
// GraphQL fragment names requested in the CMS flexible-content pipeline (see
// `graphql/CMS/GetAllPageACFFlexibleComponentsContent.ts`).
export const flexibleContentType: IFlexibleContentType.ITypes = {
    // Public pages
    pages: "DefaultTemplate_Flexiblecontent_FlexibleContent",
	// Preview pages
	previewPage: "Page_Flexiblecontent_FlexibleContent",
	previewPost: "Post_Flexiblecontent_FlexibleContent",
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX LOCALES XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// The six locales this site serves — `app/[locale]/` route segment values. English is
// the default (the CMS's only real language — see `i18n/translateContent.ts`'s doc
// comment for why every other locale is a dynamic machine-translation of this content,
// never a separately-authored one).
export const locale: ILocale.ITypes = {
    en: "en",
    fr: "fr",
    de: "de",
    es: "es",
    it: "it",
    pt: "pt",
};

// Every supported locale code, in the order the locale switcher lists them.
export const locales: string[] = Object.values(locale);

export const defaultLocale: string = locale.en;

// Native-language display names for the locale switcher (e.g. "Français", not
// "French") — a visitor should recognize their own language in its own script/spelling,
// not in whatever locale is currently active.
export const localeLabels: Record<string, string> = {
    [locale.en]: "English",
    [locale.fr]: "Français",
    [locale.de]: "Deutsch",
    [locale.es]: "Español",
    [locale.it]: "Italiano",
    [locale.pt]: "Português",
};
