"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import gsap from "gsap";
import { FC, useEffect, useRef, useCallback } from "react";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/Global/BlurryCursorMouse/styles/BlurryCursorMouse.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXX BlurryCursorMouse Component XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const BlurryCursorMouse: FC = () => {
    const size = 10;
    const circle = useRef<HTMLDivElement>(null);
    const rafId = useRef<number | null>(null);
    const mouse = useRef({x: 0, y: 0});
    const delayedMouse = useRef({x: 0, y: 0});

    const lerp = (x: number, y: number, a: number) => x * (1 - a) + y * a;

    const moveCircle = useCallback((x: number, y: number) => {
        if (circle.current) {
            gsap.set(circle.current, {x, y, xPercent: -50, yPercent: -50});
        }
    }, []);

    const manageMouseMove = useCallback(
        (e: MouseEvent) => {
            const {clientX, clientY} = e;
            mouse.current = {x: clientX, y: clientY};
            // Instantly move the cursor element to the new mouse position (for primary cursor logic)
            moveCircle(mouse.current.x, mouse.current.y);
        },
        [moveCircle]
    );

    // --- FIX: Use an inner loop function so the RAF callback does not reference `animate` before it's declared ---
    // We only need moveCircle in the dependency array.
    const animate: () => void = useCallback(() => {
        const loop = () => {
            // Apply linear interpolation (LERP) for the smooth, "blurry" effect
            delayedMouse.current = {
                x: lerp(delayedMouse.current.x, mouse.current.x, 0.08), // Using a small alpha (0.08) for delay/smoothness
                y: lerp(delayedMouse.current.y, mouse.current.y, 0.08),
            };

            // Move the circle to the delayed position
            moveCircle(delayedMouse.current.x, delayedMouse.current.y);

            // Recursively request the next animation frame using the local loop reference
            rafId.current = window.requestAnimationFrame(loop);
        };

        // Start the loop
        loop();
    }, [moveCircle]); // Depend only on stable moveCircle

    useEffect(() => {
        // Start the animation loop
        animate();
        window.addEventListener("mousemove", manageMouseMove);

        // Cleanup: Stop the animation loop and remove the event listener
        return () => {
            window.removeEventListener("mousemove", manageMouseMove);
            if (rafId.current) window.cancelAnimationFrame(rafId.current);
        };
    }, [animate, manageMouseMove]); // Depend on stable animate and manageMouseMove

    return (
        <div className={styles.blurryCursorMouse}>
            <div
                ref={circle}
                style={{
                    width: size,
                    height: size,
                    borderRadius: "100%",
                    backgroundColor: "#bff007",
                    // Use CSS transform for smoother transition on hover effects (if applied)
                    transition: `height 0.3s ease-out, width 0.3s ease-out, filter 0.3s ease-out`, 
                }}
                className={styles.element}
            >
                {/* Image/Content placeholder commented out */}
            </div>
        </div>
    );
};

BlurryCursorMouse.displayName = 'BlurryCursorMouse';

export default BlurryCursorMouse;