'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, memo, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import dateFormat from "dateformat";
import DOMPurify from "isomorphic-dompurify";
import * as IAllBlogPosts from "@/components/CMS/AllBlogPosts/types/allBlogPosts";
import { parseWpDate } from "@/graphql/CMS/parseWpDate";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/AllBlogPosts/styles/AllBlogPosts.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX PostCard Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders a single blog post summary card for the archive grid: image, date,
 * title, excerpt — in that order, following the reference design's card
 * layout. `memo`-wrapped client component since it does no data fetching of
 * its own. `featuredImage` is optional-chained since WP posts aren't
 * guaranteed to have one — falls back to no image rather than crashing. The
 * excerpt is sanitized directly with DOMPurify (same sanitizer `Paragraph`/
 * `ArticleContent` use elsewhere) rather than reusing `Paragraph` itself —
 * `Paragraph` is built around `framer-motion`'s `useScroll` for a fade-in
 * effect this card never enables, and mounting that on every card in the grid
 * (up to `POSTS_PAGE_SIZE`) was pure unused scroll-tracking overhead.
 *
 * Reads the current locale via `useParams()` (not a prop) to build its own
 * link — a Client Component can't call `getLocale()`/`next/root-params`
 * itself, but `useParams()` is the standard, stable client-side equivalent
 * for reading a route's own dynamic segments, `locale` included.
 */
const PostCard: FC<IAllBlogPosts.IPostCard> = memo(({ post }) => {

    const { locale } = useParams<{ locale: string }>();
    const cleanExcerpt = useMemo(() => ({ __html: DOMPurify.sanitize(post.excerpt) }), [post.excerpt]);

    return (
        <Link href={`/${locale}/posts/${post.slug}`} className={styles.postCard}>
            {post.featuredImage?.node?.sourceUrl && (
                <div className={styles.postThumbnailWrapper}>
                    <Image
                        src={post.featuredImage.node.sourceUrl}
                        alt={post.featuredImage.node.altText || post.title}
                        width={480}
                        height={320}
                        className={styles.postThumbnail}
                    />
                </div>
            )}
            <span className={styles.postDate}>{dateFormat(parseWpDate(post.date), "mmmm dS, yyyy")}</span>
            <h3 className={styles.postTitle}>{post.title}</h3>
            {post.excerpt && <div className={styles.postExcerpt} dangerouslySetInnerHTML={cleanExcerpt} />}
        </Link>
    );
});

PostCard.displayName = 'PostCard';

export default PostCard;
