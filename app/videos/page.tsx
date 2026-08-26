/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { Metadata, NextPage } from "next";
import { notFound } from "next/navigation";
import * as ISeo from "@/graphql/CMS/types/seo";
import * as IFlexibleContent from "@/graphql/CMS/types/flexibleContent";
import { postType, flexibleContentType, pageType } from "@/context/constants";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Queries Functions XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { getAllSeoContent } from "@/graphql/CMS/GetAllSeoContent";
import { getAllPageACFFlexibleComponentsContent } from "@/graphql/CMS/GetAllPageACFFlexibleComponentsContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import RenderFlexibleContent from "@/components/CMS/FlexibleContent/RenderFlexibleContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type ISearchParams = {
	page?: string;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Page Number Parsing XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Parses this route's raw `?page=` query param into a positive page number,
 * falling back to `1` for anything missing, non-numeric, or out of range —
 * `AllYoutubeVideos.tsx` clamps this further once it knows the real
 * `totalPages` (computed from `getAllQualifyingVideoIds`), this just protects
 * against obviously-invalid input reaching that far.
 * @param searchParams This route's raw query params.
 */
const parsePageFromSearchParams = (searchParams: ISearchParams): number => {
	const page = Number(searchParams.page);
	return Number.isInteger(page) && page > 0 ? page : 1;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Metadata XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Builds Next.js `<head>` metadata (title, description, Open Graph, canonical, robots)
 * for the video archive page, by querying WPGraphQL SEO fields for `pageType.videos`.
 * Unlike `/posts`'s arbitrary filter-combination URLs, `?page=N` here is stayed
 * indexable — standard, canonical pagination through the same underlying
 * archive, not the faceted-navigation duplicate-content risk filter
 * combinations are.
 *
 * @returns Next.js `Metadata` for the video archive page, or minimal no-index metadata
 * if the WP "Videos" page this route depends on doesn't exist yet (before its slug is
 * renamed to `videos` in wp-admin) — `VideosArchivePage` below is what actually 404s;
 * this just has to avoid crashing on `seo` being `undefined` in the meantime (same
 * pattern as `app/posts/page.tsx`'s `generateMetadata`).
 */
export const generateMetadata = async (): Promise<Metadata> => {

	const seo = await getAllSeoContent(pageType?.videos, postType.pages) as ISeo.IProps | undefined;

	if (!seo) {
		return { robots: { follow: false, index: false } };
	}

	return {
		title: seo.title,
		description: seo.metaDesc,
		openGraph: {
			type: 'website',
			url: seo.opengraphUrl,
			title: seo.opengraphTitle,
			siteName: seo.opengraphSiteName,
			description: seo.opengraphDescription
		},
		alternates: {
			canonical: seo?.canonical,
		},
		robots: {
			follow: true,
			index: true
		}
	};
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX Video Archive Page Component XXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders the YouTube video archive page. Same CMS flexible-content pipeline as
 * `app/[slug]/page.tsx` (see `ARCHITECTURE.md` §1), fixed to `pageType.videos` — the
 * WP *Page* that hosts the archive.
 *
 * Reads `searchParams.page` (real, URL-based numbered pagination — confirmed with
 * you over the earlier client-side "Show more" accumulator, since pages are now
 * genuine server fetches with a real page to link to) and threads the parsed page
 * number down through `RenderFlexibleContent` to whichever block uses it
 * (`AllYoutubeVideos`), the same way `/posts` threads its `filters`. This makes the
 * route dynamic rather than statically prerendered — the same tradeoff `/posts`
 * already accepted, not a new one.
 *
 * `getAllPageACFFlexibleComponentsContent` resolves to `null` if the WP "Videos" page
 * doesn't exist yet under this slug (either a fresh fork, or before the `youtube-videos`
 * → `videos` slug rename) or on a network-level failure — both cases 404 cleanly here
 * instead of `RenderFlexibleContent` crashing on a `null` `content` prop, matching
 * `app/[slug]/page.tsx`'s `DynamicPages`.
 */
const VideosArchivePage: NextPage<{ searchParams: Promise<ISearchParams> }> = async ({ searchParams }) => {

	let pageACFFlexibleComponentsContent: IFlexibleContent.IProps | null = null;

	try {
		pageACFFlexibleComponentsContent = await getAllPageACFFlexibleComponentsContent(
			pageType.videos,
			postType.pages,
			flexibleContentType.pages
		) as IFlexibleContent.IProps | null;
	} catch (error) {
		console.log(error);
	}

	if (!pageACFFlexibleComponentsContent) {
		notFound();
	}

	const page = parsePageFromSearchParams(await searchParams);

	return <RenderFlexibleContent content={pageACFFlexibleComponentsContent} page={page} />;
}

VideosArchivePage.displayName = 'VideosArchivePage';

export default VideosArchivePage;
