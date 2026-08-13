"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { useEffect } from "react";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXX Change Page Title On Leave Component XXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const ChangePageTitleOnLeave = () => {
    useEffect(() => {
        const documentTitleStore = document.title;
        const documentTitleOnBlur = `Come back! We miss you 😢💔 | ${documentTitleStore}`;

        const handleFocus = () => {
            document.title = documentTitleStore;
        };

        const handleBlur = () => {
            document.title = documentTitleOnBlur;
        };

        window.addEventListener("focus", handleFocus);
        window.addEventListener("blur", handleBlur);

        // Cleanup listeners when the component unmounts
        return () => {
            window.removeEventListener("focus", handleFocus);
            window.removeEventListener("blur", handleBlur);
            document.title = documentTitleStore; // Reset title on unmount
        };
    }, []);

    // This component doesn't need to render any UI
    return null;
};

ChangePageTitleOnLeave.displayName = 'ChangePageTitleOnLeave';

export default ChangePageTitleOnLeave;