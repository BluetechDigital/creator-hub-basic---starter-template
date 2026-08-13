"use client"

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import gsap from "gsap";
import { FC, memo, useLayoutEffect, useRef, useState } from "react";
import * as IIntroLoadingAnimation from "@/components/Global/Loaders/IntroLoadingAnimation/types/introLoadingAnimation";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/Global/Loaders/IntroLoadingAnimation/styles/IntroLoadingAnimation.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXX Intro Loading Animation Component XXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const IntroLoadingAnimation: FC<IIntroLoadingAnimation.IProps> = memo(() => {
    const scope = useRef<HTMLDivElement>(null);
    // Initialize state lazily to avoid triggering an effect-based re-render
    const [shouldRender, setShouldRender] = useState(() => {
        // Since we are in Next.js, we check if window exists (client-side)
        if (typeof window !== "undefined") {
            // CHANGED: Using localStorage instead of sessionStorage
            const hasLoaded = localStorage.getItem("number_loader_played");
            return !hasLoaded;
        }
        return true;
    });

    useLayoutEffect(() => {
        // If state is already false from initialization, do nothing
        if (!shouldRender) return;

        const timer = setTimeout(() => {
            const ctx = gsap.context(() => {
                const tl = gsap.timeline({
                    defaults: { ease: "expo.inOut", overwrite: "auto" },
                    onComplete: () => {
                        // --- TEMPORARY DEV MODE: Don't save to session ---
                        localStorage.setItem("number_loader_played", "true");
                        
                        gsap.to(scope.current, { 
                            opacity: 0, 
                            duration: 1, 
                            onComplete: () => setShouldRender(false) 
                        });
                    }
                });

                gsap.set(`.${styles.letter}, .${styles.letterWhite}`, { yPercent: 110 });

                tl.to(`.${styles.letter}`, { yPercent: 0, stagger: 0.03, duration: 1.25 })
                  .fromTo(`.${styles.loaderBox}`, { width: "0em" }, { width: "1em", duration: 1.25 }, "< 1.1")
                  .fromTo(`.${styles.growingImage}`, { width: "0%" }, { width: "100%", duration: 1.25 }, "<")
                  .fromTo(`.${styles.h1Start}`, { x: "0em" }, { x: "-0.05em", duration: 1.25 }, "<")
                  .fromTo(`.${styles.h1End}`, { x: "0em" }, { x: "0.05em", duration: 1.25 }, "<")
                  .fromTo(`.${styles.coverImageExtra}`, { opacity: 1 }, { opacity: 0, duration: 0.01, stagger: 0.4, ease: "none" }, "-=0.5")
                  .to(`.${styles.growingImage}`, { width: "100vw", height: "100vh", duration: 1.8 }, ">-0.2")
                  .to(`.${styles.loaderBox}`, { width: "110vw", duration: 1.8 }, "<")
                  .to(`.${styles.letterWhite}`, { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.02 }, "< 0.8")
                  .from(`.${styles.nav} a`, { yPercent: 100, duration: 1.1, ease: "expo.out", stagger: 0.08 }, "<");

            }, scope);
            return () => ctx.revert();
        }, 50);

        return () => clearTimeout(timer);
    }, []);

    if (!shouldRender) return null;

    return (
        <div ref={scope} className={styles.introLoadingAnimation}>
            <div className={styles.header}>
                <div className={styles.loader}>
                    <div className={styles.h1}>
                        <div className={styles.h1Start}>
                            <span className={styles.letter}>F</span>
                            <span className={styles.letter}>u</span>
                            <span className={styles.letter}>r</span>
                            <span className={styles.letter}>s</span>
                            <span className={styles.letter}>a</span>
                        </div>
                        <div className={styles.loaderBox}>
                            <div className={styles.loaderBoxInner}>
                                <div className={styles.growingImage}>
                                    <div className={styles.imageWrap}>
                                        <img className={`${styles.coverImageExtra} ${styles.is1}`}
                                            src="https://cdn.prod.website-files.com/6915bbf51d482439010ee790/6915bc3ac9fe346a924724bc_minimalist-architecture-2.avif"
                                            alt=""
                                        />
                                        <img className={`${styles.coverImageExtra} ${styles.is2}`}
                                            src="https://cdn.prod.website-files.com/6915bbf51d482439010ee790/6915bc3ac9fe346a924724cf_minimalist-architecture-4.avif"
                                            alt=""
                                        />
                                        <img className={`${styles.coverImageExtra} ${styles.is3}`}
                                            src="https://cdn.prod.website-files.com/6915bbf51d482439010ee790/6915bc3ac9fe346a924724c5_minimalist-architecture-3.avif"
                                            alt=""
                                        />
                                        <img className={styles.coverImage} src="https://cms.help.fursahub.com/wp-content/uploads/2026/03/e912ba6c8886a47923f1e761fa10f52ae630e3e4.webp"
                                            alt=""
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={styles.h1End}>
                            <span className={styles.letter}>H</span>
                            <span className={styles.letter}>u</span>
                            <span className={styles.letter}>b</span>
                        </div>
                    </div>
                </div>

                <div className={styles.content}>
                    <div className={styles.top}>
                        <nav className={styles.nav}>
                            <div className={styles.navStart}><a href="#" className={styles.navLink}>Osmo ©</a></div>
                            <div className={styles.navEnd}>
                                <div className={styles.navLinks}>
                                    <a href="#" className={styles.navLink}>Projects,</a>
                                    <a href="#" className={styles.navLink}>Services,</a>
                                    <a href="#" className={styles.navLink}>Blog (13)</a>
                                </div>
                                <div className={styles.navCta}><a href="#" className={styles.navLink}>Get in touch</a></div>
                            </div>
                        </nav>
                    </div>
                    {/* <div className={styles.bottom}>
                        <div className={styles.h1}>
                            <span className={styles.letterWhite}>H</span>
                            <span className={styles.letterWhite}>e</span>
                            <span className={styles.letterWhite}>l</span>
                            <span className={styles.letterWhite}>p</span>
                            <span className={`${styles.letterWhite} ${styles.isSpace}`}>Centre</span>
                        </div>
                    </div> */}
                </div>
            </div>
        </div>
    );
});

IntroLoadingAnimation.displayName = 'IntroLoadingAnimation';

export default IntroLoadingAnimation;