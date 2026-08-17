'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import {
	initial,
	fadeInUp,
	offsetStart,
	offsetFinish,
 } from "@/animations/animations";
import { FC } from "react";
import { motion } from "framer-motion";
import * as ITitleParagraph from "@/components/CMS/TitleParagraph/types/titleParagraph";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/TitleParagraph/styles/TitleParagraph.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import Paragraph from "@/components/Global/Elements/Paragraph/Paragraph";
import ScrollYProgressReveal from "@/components/Animations/ScrollYProgressReveal";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXX TitleParagraph Component XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders an animated title/paragraph pair — framer-motion fades each in on scroll into
 * view, wrapped in ScrollYProgressReveal. Title and paragraph each collapse to a `hidden`
 * class rather than rendering empty markup when their content is falsy.
 *
 * `displayParagraph` is misleadingly named: it does NOT control the paragraph's visibility
 * (emptiness already does that). It controls text ALIGNMENT — `true` centers the paragraph
 * at every breakpoint (`text-center lg:text-center`), `false` centers it on mobile but
 * left-aligns it on large screens (`text-center lg:text-left`).
 */
const TitleParagraph: FC<ITitleParagraph.IProps> = ({
	title,
	paragraph,
	displayParagraph,
}) => {

	return (
		<ScrollYProgressReveal className={styles.titleParagraph}>
			<motion.h2
				initial={initial}
				whileInView={fadeInUp}
				viewport={{once: true}}
				className={title ? styles.title : "hidden"}
			>
				{title}
			</motion.h2>
			<Paragraph
				fadeIn={false}
				content={paragraph}
				offsetStart={offsetStart}
				offsetFinish={offsetFinish}
				className={
					paragraph
						? styles.paragraph +
						` ${displayParagraph ? "text-center lg:text-center" : "text-center lg:text-left"}`
						: "hidden"
				}
			/>
		</ScrollYProgressReveal>
	);
};

TitleParagraph.displayName = 'TitleParagraph';

export default TitleParagraph;
