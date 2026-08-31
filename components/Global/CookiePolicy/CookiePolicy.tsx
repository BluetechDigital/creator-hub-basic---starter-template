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

type ICookiePolicyDict = {
    body: string;
    accept: string;
    acceptAriaLabel: string;
    decline: string;
    declineAriaLabel: string;
};

type IProps = {
    /** The `cookiePolicy` slice of the current locale's dictionary — passed down
     * from `app/[locale]/layout.tsx` (a Server Component) since this is a Client
     * Component and can't load the dictionary itself. */
    dict: ICookiePolicyDict;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXX Cookie Policy Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Cookie consent banner. Rendering is driven entirely by the `hasConsent` value
 * read from `useCookiePolicy()` context: it returns `null` until a decision has
 * been made, and otherwise renders an accept/decline banner that calls
 * `acceptCookies`/`refuseCookies` from the same context.
 * @param dict This locale's `cookiePolicy` dictionary strings.
 */
const CookiePolicy: FC<IProps> = ({ dict }) => {

    const { hasConsent, acceptCookies, refuseCookies } = useCookiePolicy();

    // Only render the banner if no decision has been made.
    if (hasConsent !== null) {
        return null;
    }

    // Otherwise, render the cookie policy banner.
    return (
        <section className={styles.cookiePolicy}>
            <div className={styles.content}>
                <Paragraph
                    className={styles.paragraph}
                    content={`<p>${dict.body}</p>`}
                />
                <div className={styles.buttonSection}>
                    <motion.button
                        initial={initial}
                        whileInView={fadeInUp}
                        onClick={acceptCookies}
                        viewport={{ once: true }}
                        aria-label={dict.acceptAriaLabel}
                        className={styles.acceptButton}
                    >
                        {dict.accept}
                    </motion.button>
                    <motion.button
                        initial={initial}
                        whileInView={fadeInUp}
                        onClick={refuseCookies}
                        viewport={{ once: true }}
                        aria-label={dict.declineAriaLabel}
                        className={styles.declineButton}
                    >
                        {dict.decline}
                    </motion.button>
                </div>
            </div>
        </section>
    );
};

CookiePolicy.displayName = "CookiePolicy";

export default CookiePolicy;