'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, memo, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import dateFormat from "dateformat";
import DOMPurify from "isomorphic-dompurify";
import * as IAllBlogPosts from "@/components/CMS/AllBlogPosts/types/allBlogPosts";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/AllBlogPosts/styles/AllBlogPosts.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX PostCard Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders a single blog post summary card for the archive grid. `memo`-wrapped
 * client component since it does no data fetching of its own. `featuredImage` is
 * optional-chained since WP posts aren't guaranteed to have one — falls back to no
 * image rather than crashing. The excerpt is sanitized directly with DOMPurify
 * (same sanitizer `Paragraph`/`ArticleContent` use elsewhere) rather than reusing
 * `Paragraph` itself — `Paragraph` is built around `framer-motion`'s `useScroll` for
 * a fade-in effect this card never enables, and mounting that on every card in the
 * grid (up to `POSTS_PAGE_SIZE`) was pure unused scroll-tracking overhead.
 */
const PostCard: FC<IAllBlogPosts.IPostCard> = memo(({ post }) => {

    const cleanExcerpt = useMemo(() => ({ __html: DOMPurify.sanitize(post.excerpt) }), [post.excerpt]);

    return (
        <Link href={`/posts/${post.slug}`} className={styles.postCard}>
            {post.featuredImage?.node?.sourceUrl && (
                <Image
                    src={post.featuredImage.node.sourceUrl}
                    alt={post.featuredImage.node.altText || post.title}
                    width={480}
                    height={320}
                    className={styles.postThumbnail}
                />
            )}
            <h3 className={styles.postTitle}>{post.title}</h3>
            <span className={styles.postDate}>{dateFormat(post.date, "mmmm dS, yyyy")}</span>
            {post.excerpt && <div className={styles.postExcerpt} dangerouslySetInnerHTML={cleanExcerpt} />}
        </Link>
    );
});

PostCard.displayName = 'PostCard';

export default PostCard;
