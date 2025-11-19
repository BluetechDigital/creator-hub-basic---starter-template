"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { gsap } from "gsap";
import { motion } from "framer-motion";
import { FC, RefObject, useEffect, useRef } from "react";
import DOMPurify from "isomorphic-dompurify";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IBlurEffectTwo = {
	content: string;
	className?: string;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXX Register the ScrollTrigger plugin with GSAP XXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

gsap.registerPlugin(ScrollTrigger);

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX BlurEffectOne Component XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const BlurEffectTwo: FC<IBlurEffectTwo> = ({content, className}) => {
	/* Sanitize the WYSIWYG paragraph content */
	const createParagraphMarkup = (paragraphContent: string) => {
		return {
			__html: DOMPurify.sanitize(paragraphContent),
		};
	};

	const wordsRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (wordsRef.current) {
			// Get the text content
			const textContent = wordsRef.current.textContent || "";
			const wordsArray = textContent.match(/\b\w+\b/g) || []; // Extract all words

			// Clear the content and dynamically wrap each word in a span
			wordsRef.current.innerHTML = ""; // Remove original content
			wordsArray.forEach((word: string) => {
				const span = document.createElement("span");
				span.textContent = word;
				if (wordsRef.current) {
					wordsRef.current.appendChild(span);
				}
			});

			// Select all the spans
			const words = wordsRef.current.querySelectorAll("span");

			// Apply the original GSAP animation styling
			gsap.fromTo(
				words,
				{
					filter: "blur(10px) brightness(0%)",
					willChange: "filter",
				},
				{
					ease: "none",
					filter: "blur(0px) brightness(100%)",
					stagger: 0.05,
					scrollTrigger: {
						trigger: wordsRef.current,
						start: "top bottom-=15%",
						end: "bottom center+=15%",
						scrub: true,
					},
				}
			);
		}
	}, []);

	return (
		<motion.div
			ref={wordsRef}
			className={content ? className : `hidden`}
			dangerouslySetInnerHTML={createParagraphMarkup(content)}
		/>
	);
};

BlurEffectTwo.displayName = 'BlurEffectTwo';

export default BlurEffectTwo;
