"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC } from "react";
import { motion } from "framer-motion";
import useCookiePolicy from "@/context/cookies";
import { fadeInUp, initial } from "@/animations/animations";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/Global/CookiePolicy/styles/CookiePolicy.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import Paragraph from "@/components/Global/Elements/Paragraph/Paragraph";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IProps = object;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXX Cookie Policy Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const CookiePolicy: FC<IProps> = () => {

    const { hasConsent, acceptCookies, refuseCookies } = useCookiePolicy();

    // Only render the banner if no decision has been made.
    if (hasConsent !== null) {
        return null;
    }

    // Otherwise, render the cookie policy banner.
    return (
        <div className={styles.cookiePolicy}>
            <div className={styles.content}>
                <Paragraph
                    className={styles.paragraph}
                    content={`<p>We use cookies to improve your browsing experience. Learn about our Privacy policy here.</p>`}
                />
                <div className={styles.buttonSection}>
                    <motion.button
                        initial={initial}
                        whileInView={fadeInUp}
                        onClick={acceptCookies}
                        viewport={{ once: true }}
                        aria-label="Accept cookies"
                        className={styles.acceptButton}
                    >
                        Accept Cookies
                    </motion.button>
                    <motion.button
                        initial={initial}
                        whileInView={fadeInUp}
                        onClick={refuseCookies}
                        viewport={{ once: true }}
                        aria-label="Decline cookies"
                        className={styles.declineButton}
                    >
                        Decline
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

CookiePolicy.displayName = "CookiePolicy";

export default CookiePolicy;