"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import gsap from "gsap";
import { usePathname } from "next/navigation";
import { FC, useEffect, useRef, useState } from "react";
import * as IPixelatedWavePageTransition from "@/components/Global/PageTransition/PixelatedWave/types/pixelatedWave";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/Global/PageTransition/PixelatedWave/styles/PixelatedWave.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXX Number of pixels in the grid XXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXX (higher = more pixels, smoother animation, but worse performance XXXXXXX
----------------------------------------------------------------------------- */

const PIXEL_AMOUNT = 16;
const TRANSITION_DURATION = 0.3; // Was 0.8 - Total length of the wave
const PIXEL_FADE_DURATION = 0.3; // Was 0.2 - How fast individual pixels blink
const STAGGER_SPEED = 0.03;      // Was 0.05 - Delay between column waves

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX Animation Logic XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export const runPixelWaveAnimation = () => {
    const transitionPanel = document.querySelector(`[data-transition-panel]`);
    const nextMain = document.querySelector("main");
    const tl = gsap.timeline();

    if (!transitionPanel || !nextMain) return tl;

    const cols = Array.from(transitionPanel.children);
    
    // Set initial clip for the next page content
    gsap.set(nextMain, { 
        clipPath: "inset(0% 100% 0% 0%)", 
        opacity: 1 
    });

    // Animate Pixel Columns In
    cols.forEach((col, i) => {
        const pixels = Array.from(col.children);
        tl.to(pixels, {
            opacity: 1,
            duration: PIXEL_FADE_DURATION,
            stagger: { amount: 0.3, from: "random" },
            ease: "none"
        }, i * STAGGER_SPEED);
    });

    // Reveal main content in steps matching the pixel columns
    tl.to(nextMain, {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: TRANSITION_DURATION,
        ease: `steps(${PIXEL_AMOUNT}, start)`
    }, 0.1);

    return tl;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXX Pixelated Wave Page Transition Component XXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const PixelatedWavePageTransition: FC<IPixelatedWavePageTransition.IProps> = () => {
    const pathname = usePathname();
    const panelRef = useRef<HTMLDivElement>(null);
    const [hasMounted, setHasMounted] = useState(false);

    // 1. Solve the "Synchronous SetState" error by using requestAnimationFrame
    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            setHasMounted(true);
        });
        return () => cancelAnimationFrame(frame);
    }, []);

    const generateGrid = () => {
        if (!panelRef.current) return;
        const panel = panelRef.current;
        const isPortrait = window.innerHeight > window.innerWidth;
        
        const cellSize = isPortrait ? window.innerHeight / PIXEL_AMOUNT : window.innerWidth / PIXEL_AMOUNT;
        const crossAmount = Math.ceil((isPortrait ? window.innerWidth : window.innerHeight) / cellSize);

        panel.innerHTML = ""; 
        panel.style.display = "grid";

        if (isPortrait) {
            panel.style.gridTemplateRows = `repeat(${PIXEL_AMOUNT}, 1fr)`;
            panel.style.gridTemplateColumns = "1fr";
        } else {
            panel.style.gridTemplateColumns = `repeat(${PIXEL_AMOUNT}, 1fr)`;
            panel.style.gridTemplateRows = "1fr";
        }

        for (let i = 0; i < PIXEL_AMOUNT; i++) {
            const col = document.createElement("div");
            col.className = styles.col;
            col.style.display = "flex";
            col.style.flexDirection = isPortrait ? "row" : "column";
            
            for (let j = 0; j < crossAmount; j++) {
                const pixel = document.createElement("div");
                pixel.className = styles.pixel;
                pixel.style.opacity = "0"; 
                col.appendChild(pixel);
            }
            panel.appendChild(col);
        }
    };

    // 2. Run logic only on the Client
    useEffect(() => {
        if (!hasMounted) return;

        generateGrid();
        
        const handleResize = () => generateGrid();
        window.addEventListener("resize", handleResize);

        // ENTER ANIMATION: Runs when the page is loaded
        const allPixels = panelRef.current?.querySelectorAll(`.${styles.pixel}`);
        if (allPixels?.length) {
            gsap.set(allPixels, { opacity: 1 });
            gsap.to(allPixels, {
                opacity: 0,
                duration: 0.5,
                stagger: { amount: 0.4, from: "random" },
                ease: "power2.inOut"
            });
        }

        return () => window.removeEventListener("resize", handleResize);
    }, [hasMounted, pathname]);

    // 3. SSR Safe Return
    if (!hasMounted) return null;

    return (
        <div data-transition-wrap className={styles.PixelatedWavePageTransition}>
            <div ref={panelRef} data-transition-panel className={styles.panel} />
        </div>
    );
};

PixelatedWavePageTransition.displayName = 'PixelatedWavePageTransition';

export default PixelatedWavePageTransition;