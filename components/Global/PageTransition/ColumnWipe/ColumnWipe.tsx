"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import gsap from "gsap";
import { usePathname } from "next/navigation";
import { FC, useEffect, memo, useState } from "react";
import * as IColumnWipePageTransition from "@/components/Global/PageTransition/ColumnWipe/types/columnWipe";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/Global/PageTransition/ColumnWipe/styles/ColumnWipe.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXX Column Wipe Page Transition Component XXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const ColumnWipePageTransition: FC<IColumnWipePageTransition.IProps> = memo(() => {
    const pathname = usePathname();
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        // Use requestAnimationFrame to avoid the "synchronous setState" warning.
        // This ensures the update happens after the initial paint.
        const rafId = requestAnimationFrame(() => {
            setHasMounted(true);
        });
        
        return () => cancelAnimationFrame(rafId);
    }, []);

    useEffect(() => {
        // Only run logic once hydrated and when pathname changes
        if (!hasMounted) return;

        const columns = document.querySelectorAll("[data-transition-column]");
        
        if (columns.length) {
            // ENTER ANIMATION: Slide from 100% (covering) to 200% (clearing)
            gsap.to(columns, {
                yPercent: 200,
                duration: 0.6,
                stagger: 0.06,
                ease: "power2.inOut",
                overwrite: "auto"
            });
        }
    }, [hasMounted, pathname]);

    if (!hasMounted) return null;

    return (
        <div className={styles.transition} data-transition-wrap>
            <div className={styles.transition__panels}>
                {[...Array(5)].map((_, i) => (
                    <div key={i} data-transition-column className={styles.transition__panel} />
                ))}
            </div>
            <div className={styles.transition__lines}>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className={styles.transition__line} />
                ))}
            </div>
        </div>
    );
});

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX Leave Animation Logic XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export const runColumnWipeAnimation = () => {
    const columns = document.querySelectorAll("[data-transition-column]");
    const tl = gsap.timeline();

    if (!columns.length) return tl;

    tl.fromTo(columns, 
        { yPercent: 0 }, 
        {
            yPercent: 100,
            duration: 0.6,
            stagger: {
                each: 0.06,
                from: "end"
            },
            ease: "power2.inOut"
        }
    );

    return tl;
};

ColumnWipePageTransition.displayName = 'ColumnWipePageTransition';

export default ColumnWipePageTransition;