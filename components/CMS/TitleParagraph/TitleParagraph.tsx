/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import {
	initial,
	fadeInUp,
	offsetStart,
	offsetFinish,
 } from "@/animations/animations";
import { FC, memo } from "react";
import { motion } from "framer-motion";

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
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type ITitleParagraph = {
	title: string;
	paragraph: string;
	displayParagraph: boolean;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX TitleParagraph Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const TitleParagraph: FC<ITitleParagraph> = memo(({
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
});

TitleParagraph.displayName = 'TitleParagraph';

export default TitleParagraph;
