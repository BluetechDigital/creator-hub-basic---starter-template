"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import Image from "next/image";
import { motion } from "framer-motion";
import { FC, memo, useMemo } from "react";
import { useParams } from "next/navigation";
import useGlobalContext from "@/context/global";
import { getClientDictionary } from "@/i18n/dictionaries.client";
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

/**
 * 404 error page content. Takes zero props — all of its text and background image
 * come from `errorPageContent` on `useGlobalContext()`, i.e. this is entirely
 * CMS-driven despite the empty component signature (already machine-translated
 * upstream, in `app/[locale]/layout.tsx`'s `translateErrorPageContent`, for
 * non-English locales — this component just renders whatever it's given).
 *
 * The "Error 404" badge is genuinely static UI chrome, though, not CMS content —
 * translated via `getClientDictionary()` (`useParams()` for the locale, same as
 * every other Client Component in this app that needs it) rather than the usual
 * `getDictionary()`: this component is rendered from both `not-found.tsx` (a
 * Server Component, which could pass a `dict` prop) and `error.tsx` (a React
 * error boundary, which can't — it renders outside the normal Server Component
 * tree with no data-fetching hook of its own) — see `getClientDictionary()`'s
 * own doc comment for why a client-safe dictionary exists for exactly this case.
 */
const Error: FC = memo(() => {
	const globalContext = useGlobalContext();
	const { locale } = useParams<{ locale: string }>();
	const dict = getClientDictionary(locale);

	// `themesOptionsContent` is typed as always-present (IGlobal.IProps), but
	// `getThemesOptionsContent()` actually resolves to `undefined` whenever the
	// WP "Global Content" ACF options page is missing or unpublished (a fresh
	// fork, before anyone's created it in wp-admin — see that function's own
	// doc comment) — confirmed live, this 404/error page is the one place that
	// content reaches, and it crashed outright rather than degrading. Renders
	// nothing rather than a half-populated error page in that state.
	const errorPageContent = globalContext.themesOptionsContent?.errorPageContent;

	if (!errorPageContent) {
		return null;
	}

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
							{dict.notFound.errorBadge}
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