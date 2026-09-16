/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import Link from "next/link";
import { getVideoArticleLink } from "@/graphql/CMS/GetVideoArticleLink";
import { getLocale } from "@/i18n/getLocale";
import { getDictionary } from "@/i18n/dictionaries";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/app/[locale]/videos/[slug]/styles/SingleVideo.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IVideoArticleLink = {
	videoId: string;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX VideoArticleLink Component XXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Links a video page to its generated written article, when one exists and
 * has been published — see `app/api/videos/generate-articles/route.ts` /
 * `api/WordPress/CreateVideoArticleDraft.ts`. The generated article lives as
 * a standalone WordPress post (reusing the full blog pipeline: translation,
 * SEO, comments) rather than content embedded on this page, so without this
 * link a visitor watching the video has no way to discover the article
 * exists — this closes that gap.
 *
 * Renders nothing (not a "coming soon" placeholder) when no matching
 * published post exists yet — most videos won't have one at any given
 * moment: it's either still awaiting the creator's review as a draft, was
 * skipped (no usable transcript), or the video simply hasn't been processed
 * by the weekly cron yet. Same graceful-empty-state convention as
 * `LatestVideos`.
 * @param videoId The video currently being viewed.
 */
const VideoArticleLink = async ({ videoId }: IVideoArticleLink) => {

	const [locale, article] = await Promise.all([getLocale(), getVideoArticleLink(videoId)]);

	if (!article) return null;

	const dict = await getDictionary(locale);

	return (
		<div className={styles.videoArticleLink}>
			<div className={styles.videoArticleLinkCard}>
				<span className={styles.videoArticleLinkText}>{dict.videos.articleAvailable}</span>
				<Link href={`/${locale}/posts/${article.slug}`} className={styles.videoArticleLinkCta}>
					{dict.videos.readArticle}
				</Link>
			</div>
		</div>
	);
};

VideoArticleLink.displayName = 'VideoArticleLink';

export default VideoArticleLink;
