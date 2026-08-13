/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import DOMPurify from "isomorphic-dompurify";
import { FC, memo, useRef, useMemo } from "react";
import { motion, useScroll, MotionValue } from "framer-motion";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/Global/Elements/Paragraph/styles/Paragraph.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IParagraph = {
	fadeIn?: boolean;
	content: string;
	className: string;
	offsetStart?: number;
	offsetFinish?: number;
	styleTextColor?: MotionValue<string> | string;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX Paragraph Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders CMS-authored WYSIWYG rich-text HTML via `dangerouslySetInnerHTML`, running it
 * through DOMPurify first since the markup comes from editor input and must be sanitized
 * against XSS before injection. Optionally fades in as the container scrolls into view;
 * `offsetStart`/`offsetFinish` are scroll-progress trigger fractions (0-1, relative to
 * viewport height — not pixel values) marking where that scroll tracking starts and ends,
 * and only affect opacity when `fadeIn` is true. Renders with a `hidden` class when
 * `content` is empty.
 */
const Paragraph: FC<IParagraph> = memo(({
	content,
	className,
	fadeIn = false,
	styleTextColor,
	offsetStart = 0.9,
	offsetFinish = 0.5,
}) => {
	const container = useRef<HTMLDivElement>(null);

	const {scrollYProgress} = useScroll({
		target: container,
		offset: [`start ${offsetStart}`, `start ${offsetFinish}`],
	});

	/* Use useMemo to Sanitize the WYSIWYG paragraph &
	prevent re-sanitizing content on every render */
    const cleanMarkup = useMemo(() => {
        // Only sanitize if content exists, otherwise return empty HTML
        return content ? { __html: DOMPurify.sanitize(content) } : { __html: '' };
	}, [content]);

	// Combine class names more cleanly
    const paragraphClasses = useMemo(() => {
        if (!content) {
			return 'hidden';
		}
        return `${styles.paragraph} block ${className}`.trim();
	}, [content, className]);
	
	return (
		<motion.div
			ref={container}
			style={{
				color: styleTextColor,
				opacity: fadeIn ? scrollYProgress : 1,
			}}
            className={paragraphClasses}
			dangerouslySetInnerHTML={cleanMarkup}
		/>
	);
});

Paragraph.displayName = 'Paragraph';

export default Paragraph;
