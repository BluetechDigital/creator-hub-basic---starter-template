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

// CMS content translation + locale-aware SEO
import { translateFields } from "@/i18n/translateContent";
import { buildLocaleAlternates } from "@/i18n/buildAlternates";

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
 * SEO text fields are machine-translated for non-English locales via
 * `translateFields` (a no-op for English). `alternates` is rebuilt via
 * `buildLocaleAlternates`, carrying `?page=N` through so each indexable page
 * gets its own canonical/hreflang rather than every page collapsing onto page 1.
 * @param params - Route params promise; resolves to `{locale}`.
 * @param searchParams This route's raw query params — same shape `VideosArchivePage`
 * receives, so both resolve the page number identically.
 * @returns Next.js `Metadata` for the video archive page, or minimal no-index metadata
 * if the WP "Videos" page this route depends on doesn't exist yet (before its slug is
 * renamed to `videos` in wp-admin) — `VideosArchivePage` below is what actually 404s;
 * this just has to avoid crashing on `seo` being `undefined` in the meantime (same
 * pattern as `app/[locale]/posts/page.tsx`'s `generateMetadata`).
 */
export const generateMetadata = async ({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<ISearchParams> }): Promise<Metadata> => {

	const { locale } = await params;
	const seo = await getAllSeoContent(pageType?.videos, postType.pages) as ISeo.IProps | undefined;

	if (!seo) {
		return { robots: { follow: false, index: false } };
	}

	const page = parsePageFromSearchParams(await searchParams);
	const translatedSeo = await translateFields({
		title: seo.title,
		metaDesc: seo.metaDesc,
		opengraphTitle: seo.opengraphTitle,
		opengraphDescription: seo.opengraphDescription,
	});

	return {
		title: translatedSeo.title,
		description: translatedSeo.metaDesc,
		openGraph: {
			type: 'website',
			url: seo.opengraphUrl,
			title: translatedSeo.opengraphTitle,
			siteName: seo.opengraphSiteName,
			description: translatedSeo.opengraphDescription,
		},
		alternates: buildLocaleAlternates(locale, page > 1 ? `/videos?page=${page}` : '/videos'),
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
 * `app/[locale]/[slug]/page.tsx` (see `ARCHITECTURE.md` §1), fixed to `pageType.videos` — the
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
 * `app/[locale]/[slug]/page.tsx`'s `DynamicPages`.
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
