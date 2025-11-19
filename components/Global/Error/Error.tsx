"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

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

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Error Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const Error: FC = memo(() => {
	const globalContext = useGlobalContext();

	// Optimize inline styles:
	const backgroundImageStyle = useMemo(() => ({
		backgroundImage: globalContext.themesOptionsContent.errorPageContent.backgroundImage.sourceUrl ? `linear-gradient(0deg, 
		rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.80)),
		url("${globalContext.themesOptionsContent.errorPageContent.backgroundImage.sourceUrl}")` : 'none',
	}), [globalContext.themesOptionsContent.errorPageContent.backgroundImage.sourceUrl]);
	
	return (
		<div className={styles.error} style={backgroundImageStyle}>
			<div className={styles.container}>
				<div className={styles.content}>
					<motion.h1
						initial={initialTwo}
						whileInView={fadeIn}
						viewport={{once: true}}
						className={styles.title}
					>
						{globalContext.themesOptionsContent.errorPageContent.title}
					</motion.h1>
					<Paragraph
						className={styles.paragraph}
						content={globalContext.themesOptionsContent.errorPageContent.paragraph}
					/>
				</div>
			</div>
		</div>
	);
});

Error.displayName = 'Error';

export default Error;