/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, Suspense, ComponentType } from 'react';
import * as IFlexibleContent from "@/graphql/CMS/types/flexibleContent";
import * as IPost from "@/graphql/CMS/types/post";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX Dynamic Component Loaders XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Registry of every CMS block component, keyed by its simple name (e.g. "Hero", "AboutUs")
 * — the same name that appears as the suffix of a block's ACF `fieldGroupName`. Each entry
 * is a plain dynamic `import()`, awaited server-side by `ResolvedBlock` below — not
 * `React.lazy()`. Several blocks (`AllYoutubeVideos`, `AllYoutubeShortsVideos`,
 * `AllBlogPosts`) are themselves async Server Components that fetch their own data, and
 * React does not support rendering an async component through `React.lazy()`/`createElement`
 * from a Client Component ("<X> is an async Client Component", "component was suspended by
 * an uncached promise") — only a Server Component can `await` and render one directly, which
 * is why this module and `RenderFlexibleContent`/`ResolvedBlock` below carry no `'use client'`
 * directive. Adding a new block type means adding it here with a key that matches the ACF
 * field group's simple name exactly (see ARCHITECTURE.md §1) — the lookup below depends on
 * that match, and blockRegistration.test.ts guards against this map and the
 * `components/CMS/` folders drifting apart.
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const DynamicComponentLoaders: Record<string, () => Promise<{ default: ComponentType<any> }>> = {
    Hero: () => import("@/components/CMS/Hero/Hero"),
    HeroTwo: () => import("@/components/CMS/HeroTwo/HeroTwo"),
    AboutUs: () => import("@/components/CMS/AboutUs/AboutUs"),
    ContactForm: () => import("@/components/CMS/ContactForm/ContactForm"),
    CallToAction: () => import("@/components/CMS/CallToAction/CallToAction"),
    InstagramFeed: () => import("@/components/CMS/InstagramFeed/InstagramFeed"),
    CookiePolicies: () => import("@/components/CMS/CookiePolicies/CookiePolicies"),
    TitleParagraph: () => import("@/components/CMS/TitleParagraph/TitleParagraph"),
    CallToActionTwo: () => import("@/components/CMS/CallToActionTwo/CallToActionTwo"),
    PrivacyPolicies: () => import("@/components/CMS/PrivacyPolicies/PrivacyPolicies"),
    SponsorshipInfo: () => import("@/components/CMS/SponsorshipInfo/SponsorshipInfo"),
    YoutubeVideoGrid: () => import("@/components/CMS/YouTubeVideoGrid/YouTubeVideoGrid"),
    AllYoutubeVideos: () => import("@/components/CMS/AllYoutubeVideos/AllYoutubeVideos"),
    AllYoutubeShortsVideos: () => import("@/components/CMS/AllYoutubeShortsVideos/AllYoutubeShortsVideos"),
    AllBlogPosts: () => import("@/components/CMS/AllBlogPosts/AllBlogPosts"),
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import SVGLoader from "@/components/CMS/FlexibleContent/fragments/SVGLoader";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Resolved Block XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IResolvedBlockProps = IFlexibleContent.IBaseFlexibleContentProps & {
    simpleName: string;
    filters?: IPost.IPostFilters;
    page?: number;
};

/**
 * Dynamically imports and renders a single resolved block. Kept as its own tiny async
 * Server Component (rather than inlined in `RenderFlexibleContent`'s render loop) so each
 * block gets its own `<Suspense>` boundary and can resolve/stream independently instead of
 * the whole page waiting on the slowest block.
 *
 * `filters` (the blog archive's tag/category/date query params, parsed in
 * `app/[locale]/posts/page.tsx`) and `page` (the video archive's `?page=` number, parsed in
 * `app/[locale]/videos/page.tsx`) are passed to every block the same way `item`'s ACF fields
 * already are — only `AllBlogPosts`/`AllYoutubeVideos` respectively read them, every
 * other block ignores the extra props exactly as it already ignores whichever of
 * `item`'s fields don't apply to it.
 */
const ResolvedBlock = async ({ simpleName, filters, page, ...item }: IResolvedBlockProps) => {
    const mod = await DynamicComponentLoaders[simpleName]();
    const Component = mod.default;

    return <Component {...item} filters={filters} page={page} />;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX Flexible Content Component XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IProps = {
    content: IFlexibleContent.IProps;
    /** The blog archive's tag/category/date filters (parsed in `app/[locale]/posts/page.tsx`) — only relevant to the `AllBlogPosts` block, but threaded through every block the same way `item`'s ACF fields are (see `ResolvedBlock`'s doc comment). */
    filters?: IPost.IPostFilters;
    /** The video archive's current `?page=` number (parsed in `app/[locale]/videos/page.tsx`) — only relevant to the `AllYoutubeVideos` block, threaded the same way `filters` is. */
    page?: number;
};

/**
 * Renders the flexible-content blocks for the current page in whatever order a CMS editor
 * arranged them in WordPress — the last step of the slug → rendered-blocks pipeline
 * described in ARCHITECTURE.md §1.
 *
 * Takes the page's block content array directly as a prop instead of reading it from
 * `PageContextProvider` via `usePageContext` (both removed) — that Context existed for
 * exactly one consumer (this component), and resolving blocks server-side (see
 * `DynamicComponentLoaders`'s doc comment for why) removed the Client Component boundary it
 * was there to cross.
 *
 * For each block:
 * 1. derives its simple name (e.g. "Hero") by slicing everything after the last underscore
 *    off its ACF `fieldGroupName` (e.g. `DefaultTemplate_Flexiblecontent_FlexibleContent_Hero`);
 * 2. skips it entirely if no matching loader is registered, or if the CMS editor toggled
 *    `displaySection` off;
 * 3. renders `ResolvedBlock` inside its own `<Suspense>` so each block streams in
 *    independently as its dynamic import (and any data it fetches) resolves.
 */
const RenderFlexibleContent: FC<IProps> = ({ content, filters, page }) => {
    return (
        <>
            {content.map((item, index) => {

                /* Efficiently extract the component's simple name (e.g. 'Hero', or 'AboutUs' or 'CallToAction')
                by finding the index of the last underscore and slicing the string. Basically removing the long
                Advanced Custom Fields (ACF) component fieldGroupName (e.g., "DefaultTemplate_Flexiblecontent_FlexibleContent_Hero"). */
                const simpleName = item.fieldGroupName.substring(item.fieldGroupName.lastIndexOf('_') + 1);

                // Skip rendering if no matching component is registered, or if it's hidden
                if (!DynamicComponentLoaders[simpleName] || item.displaySection !== true) {
                    return null;
                }

                return (
                    <section className={simpleName} key={item.fieldGroupName + "-" + index}>
                        <Suspense fallback={<SVGLoader/>}>
                            {/* {...item} spreads before the explicit props (not after) so a raw
                            ACF field that happened to be named "simpleName"/"filters"/"page" can
                            never silently win over the real values — JSX spread order means the
                            last key wins, and item is untyped CMS data, not a value this
                            component controls. */}
                            <ResolvedBlock {...item} simpleName={simpleName} filters={filters} page={page} />
                        </Suspense>
                    </section>
                );
            })}
        </>
    );
};

RenderFlexibleContent.displayName = 'RenderFlexibleContent';

export default RenderFlexibleContent;
