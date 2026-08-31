/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { Metadata } from "next";
import { notFound } from "next/navigation";
import * as ISeo from "@/graphql/CMS/types/seo";
import { postType, flexibleContentType } from "@/context/constants";
import * as IFlexibleContent from "@/graphql/CMS/types/flexibleContent";

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

// Structured Data (JSON-LD)
import StructuredData from "@/components/Global/StructuredData/StructuredData";
import { buildBreadcrumbListSchema } from "@/components/Global/StructuredData/builders";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const SITE_URL: string | undefined = process.env.SITE_URL;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Metadata XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Builds Next.js `<head>` metadata (title, description, Open Graph, canonical, robots)
 * for a CMS-driven page identified by its slug, by querying WPGraphQL SEO fields for
 * that slug.
 *
 * `params` is awaited before use because Next.js's App Router passes route params as a
 * Promise for async server components/functions — `params` must be resolved before its
 * `slug` property can be read.
 *
 * SEO text fields are machine-translated for non-English locales via
 * `translateFields` (a no-op for English) — see `i18n/translateContent.ts`.
 * The page's own ACF flexible-content body is translated separately, block by
 * block, in `RenderFlexibleContent.tsx`'s `ResolvedBlock` — only the allowlisted
 * prose fields in its `PROSE_FIELDS` map, not a blind walk of every ACF field
 * (see that file's doc comment for why). `alternates` is rebuilt via
 * `buildLocaleAlternates` rather than trusting Yoast's raw un-prefixed
 * `seo.canonical`.
 * @param params - Route params promise; resolves to `{locale, slug}` for the current page.
 * @returns Next.js `Metadata` for this page, or minimal no-index metadata if the slug
 * doesn't match a published page — `DynamicPages` below is what actually 404s; this just
 * has to avoid crashing on `seo` being `undefined` in the meantime.
 */
export const generateMetadata = async ({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> => {

	const { locale, slug } = await params;

	const seo = await getAllSeoContent(slug, postType.pages) as ISeo.IProps | undefined;

	if (!seo) {
		return { robots: { follow: false, index: false } };
	}

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
		alternates: buildLocaleAlternates(locale, `/${slug}`),
		robots: {
			follow: true,
			index: true
		}
	};
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX Dynamic Pages Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders a CMS-driven page for the given slug. This is the entry point for the CMS
 * flexible-content pipeline documented in `ARCHITECTURE.md` §1: it fetches the page's
 * ACF flexible-content blocks (via a two-pass GraphQL query in
 * `getAllPageACFFlexibleComponentsContent`) and its SEO/breadcrumb data, and hands the
 * block data straight to `RenderFlexibleContent`, which resolves each block to a
 * component via `DynamicComponentLoaders` further down the tree — no per-page React
 * code is written here or per-page-type.
 *
 * Content and SEO are fetched in parallel via `Promise.all` since neither depends on the
 * other's result, avoiding a sequential network round-trip.
 *
 * `getAllPageACFFlexibleComponentsContent`/`getAllSeoContent` resolve to `null`/`undefined`
 * for a slug that doesn't match a published page, and can also throw on a network-level
 * failure — both cases are treated as "not found" here, so a bad or stale slug (an old
 * bookmarked/indexed URL after a page gets renamed in WordPress, for instance) 404s cleanly
 * instead of surfacing as an unhandled 500.
 *
 * `params` is awaited before use because Next.js's App Router passes route params as a
 * Promise for async server components — `params` must be resolved before its `slug`
 * property can be read.
 *
 * @param params - Route params promise; resolves to `{locale, slug}` for the current page.
 */
const DynamicPages = async ({ params }: { params: Promise<{ locale: string; slug: string }> }) => {

	/* Extract slug directly from params to ensure it's resolved before use. */
	const { slug } = await params;

	let pageACFFlexibleComponentsContent: IFlexibleContent.IProps | null = null;
	let seo: ISeo.IProps | undefined;

	try {
		// Current Page ACF Flexible Components Content
		[pageACFFlexibleComponentsContent, seo] = await Promise.all([
			getAllPageACFFlexibleComponentsContent(
				slug,
				postType.pages,
				flexibleContentType.pages
			) as Promise<IFlexibleContent.IProps | null>,
			getAllSeoContent(slug, postType.pages) as Promise<ISeo.IProps | undefined>,
		]);
	} catch (error) {
		console.log(error);
	}

	if (!pageACFFlexibleComponentsContent) {
		notFound();
	}

	const breadcrumbSchema = buildBreadcrumbListSchema({
		siteUrl: SITE_URL!,
		slug,
		pageTitle: seo?.title ?? slug,
	});

	return (
		<>
			<StructuredData data={breadcrumbSchema} />
			<RenderFlexibleContent content={pageACFFlexibleComponentsContent} />
		</>
	);
}

DynamicPages.displayName = 'DynamicPages';

export default DynamicPages;