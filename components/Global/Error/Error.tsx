"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import Image from "next/image";
import { motion } from "framer-motion";
import { FC, memo, useMemo } from "react";
import useGlobalContext from "@/context/global";
import { fadeIn, initialTwo } from "@/animations/animations";	

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/Global/Error/styles/Error.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import Paragraph from "@/components/Global/Elements/Paragraph/Paragraph";
import ContentSliceRevealMaskAnimation from "@/components/Animations/ContentSliceRevealMaskAnimation";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Error Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const Error: FC = memo(() => {
	const globalContext = useGlobalContext();

	const errorPageContent = globalContext.themesOptionsContent.errorPageContent;
	
	return (
		<div className={styles.error}>
			<div className={styles.container}>
				<div className={styles.contentWrapper}>
					<div className={styles.topSection}>
						<motion.span
							initial={initialTwo}
							whileInView={fadeIn}
							viewport={{once: true}}
							className={styles.span}
						>
							Error 404
						</motion.span>
						<ContentSliceRevealMaskAnimation>
							<motion.h1
								initial={initialTwo}
								whileInView={fadeIn}
								viewport={{once: true}}
								className={styles.title}
							>
								{errorPageContent.title}
							</motion.h1>
						</ContentSliceRevealMaskAnimation>
						<Paragraph
							className={styles.paragraph}
							content={errorPageContent.paragraph}
						/>
					</div>
					<div className={styles.bottomSection}>
					</div>
				</div>
				<Image
					alt={errorPageContent.backgroundImage.altText}
					src={errorPageContent.backgroundImage.sourceUrl}
					width={errorPageContent.backgroundImage.mediaDetails?.width || 1000}
					height={errorPageContent.backgroundImage.mediaDetails?.height || 1000}
					className={errorPageContent.backgroundImage.sourceUrl ? styles.image : `hidden`}
				/>
			</div>
		</div>
	);
});

Error.displayName = 'Error';

export default Error;