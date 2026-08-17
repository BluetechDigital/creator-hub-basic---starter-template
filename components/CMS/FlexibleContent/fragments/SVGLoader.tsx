'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC } from 'react';
import { motion } from "framer-motion";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXX SpinningTextLoader Components XXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/** Suspense fallback shown while a lazy-loaded CMS block (see RenderFlexibleContent) streams in — a spinning arrow SVG, no props. */
const SVGLoader: FC = () => {
    return (
        <div className="w-full h-full min-h-screen flex flex-col items-center justify-center">
            <motion.svg
                width="24"
                height="24"
                fill="none"
                strokeWidth="0.25"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                xmlns="http://www.w3.org/2000/svg"
                className="w-[min(30vw,300px)] h-[min(30vw,300px)] m-auto stroke-[#e5e7eb] [--fill-final:#e5e7eb] [--fill-initial:#f7f7f7] dark:stroke-[#e5e7eb] dark:[--fill-final:#e5e7eb] dark:[--fill-initial:#f7f7f7]"
            >
                <motion.path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <motion.path
                    initial={{ pathLength: 0, fill: "var(--fill-initial)" }}
                    animate={{ pathLength: 1, fill: "var(--fill-final)" }}
                    transition={{
                        duration: 2,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatType: "reverse",
                    }}
                    d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11"
                />
            </motion.svg>
        </div>
    );
}

SVGLoader.displayName = 'SVGLoader';

export default SVGLoader;