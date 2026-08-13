/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, memo, useMemo } from "react";
import DOMPurify from "isomorphic-dompurify";
import { motion, MotionValue } from "framer-motion";
import { fadeIn, initialTwo } from "@/animations/animations";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type ITitle = {
    content: string;
    className?: string;
    styleTextColor?: MotionValue<string> | string;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Title Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders CMS-authored WYSIWYG title HTML via `dangerouslySetInnerHTML`, running it
 * through DOMPurify first since the markup comes from editor input and must be
 * sanitized against XSS before injection. Fades in once when it scrolls into view
 * (`whileInView`, `viewport={{ once: true }}`). Renders with a `hidden` class when
 * `content` is empty.
 */
const Title: FC<ITitle> = memo(({
    content,
    styleTextColor,
    className = '',
}) => {

    /* Sanitize the WYSIWYG title content */
    // Use useMemo to prevent re-sanitizing content on every render
    const cleanMarkup = useMemo(() => {
        // Only sanitize if content exists, otherwise return empty HTML
        return content ? { __html: DOMPurify.sanitize(content) } : { __html: '' };
	}, [content]);
	
    const titleClasses = useMemo(() => {
        if (!content) {
            return 'hidden';
        }
        return className.trim();
    }, [content, className]);

    return (
        <motion.div
            initial={initialTwo}
            whileInView={fadeIn}
            viewport={{once: true}}
            className={titleClasses}
            style={{ color: styleTextColor}}
            dangerouslySetInnerHTML={cleanMarkup}
        />
    );
});

Title.displayName = 'Title';

export default Title;