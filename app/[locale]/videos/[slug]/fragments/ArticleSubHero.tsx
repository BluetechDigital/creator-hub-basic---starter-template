/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import Image from "next/image";
import * as IPost from "@/graphql/CMS/types/post";
import { parseWpDate } from "@/graphql/CMS/parseWpDate";
import { getLocale } from "@/i18n/getLocale";
import { getDictionary, formatTemplate } from "@/i18n/dictionaries";
import { formatLocaleDate } from "@/i18n/formatLocaleDate";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/app/[locale]/videos/[slug]/styles/SingleVideo.module.css";
// Reused as-is for the meta row (avatar/name/date/read-time) — identical
// styling to the single-post page's own meta row, not duplicated here.
import postStyles from "@/app/[locale]/posts/[slug]/styles/SinglePost.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IArticleSubHero = {
	post: IPost.IProps;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX ArticleSubHero Component XXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Introduces the generated article embedded below it on the video page — a
 * deliberately lighter version of the single-post page's `PostHero.tsx`:
 * title and an author/date/read-time meta row only. No featured image (the
 * video embed above is already this page's hero visual), no author bio, no
 * `PostTaxonomies`, no `EngagementBar` — comments/reactions for the embedded
 * article are a deferred follow-up, not part of this pass.
 *
 * The title renders as an **`<h2>`**, not `<h1>` — the video's own title
 * (`VideoHero.tsx`) stays this page's one `<h1>`; this section is visually
 * and semantically subordinate to it, per its own name.
 *
 * Async Server Component — reads the current locale directly (`getLocale()`)
 * for date formatting and the "min read" text, same self-fetching pattern as
 * `PostHero.tsx`.
 * @param post The article's content fields (already translated), as returned
 * by `getPostContentBySlug`/`translateFields` in `app/[locale]/videos/[slug]/page.tsx`.
 */
const ArticleSubHero = async ({ post }: IArticleSubHero) => {

	const locale = await getLocale();
	const dict = await getDictionary(locale);

	return (
		<section className={styles.articleSubHero}>
			<div className={styles.articleSubHeroInner}>
				<span className={styles.articleSubHeroEyebrow}>{dict.videos.articleAvailable}</span>
				<h2 className={styles.articleSubHeroTitle}>{post.title}</h2>
				<div className={postStyles.postMeta}>
					{post.author?.node?.avatar?.url && (
						<Image
							width={32}
							height={32}
							alt={post.author.node.name}
							src={post.author.node.avatar.url}
							className={postStyles.postAuthorAvatar}
						/>
					)}
					{post.author?.node?.name && (
						post.author.node.url ? (
							<a
								href={post.author.node.url}
								target="_blank"
								rel="noopener noreferrer"
								className={postStyles.postMetaText}
							>
								{post.author.node.name}
							</a>
						) : (
							<span className={postStyles.postMetaText}>{post.author.node.name}</span>
						)
					)}
					<span className={postStyles.postMetaDot} aria-hidden="true" />
					<span className={postStyles.postMetaText}>{formatLocaleDate(parseWpDate(post.date), locale, true)}</span>
					{post.seo?.readingTime ? (
						<>
							<span className={postStyles.postMetaDot} aria-hidden="true" />
							<span className={postStyles.postMetaText}>{formatTemplate(dict.singlePost.minRead, { count: String(post.seo.readingTime) })}</span>
						</>
					) : null}
				</div>
			</div>
		</section>
	);
};

ArticleSubHero.displayName = 'ArticleSubHero';

export default ArticleSubHero;
