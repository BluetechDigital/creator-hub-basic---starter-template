'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import dateFormat from "dateformat";
import * as IAllBlogPosts from "@/components/CMS/AllBlogPosts/types/allBlogPosts";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import Paragraph from "@/components/Global/Elements/Paragraph/Paragraph";

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
 * image rather than crashing. The excerpt is rendered via the existing `Paragraph`
 * component (already sanitizes CMS WYSIWYG HTML via DOMPurify and hides itself when
 * empty) rather than a second hand-rolled sanitize step.
 */
const PostCard: FC<IAllBlogPosts.IPostCard> = memo(({ post }) => {

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
            <Paragraph content={post.excerpt} className={styles.postExcerpt} />
        </Link>
    );
});

PostCard.displayName = 'PostCard';

export default PostCard;
