"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { runColumnWipeAnimation } from "@/components/Global/PageTransition/ColumnWipe/ColumnWipe";
import * as IColumnWipePageTransition from "@/components/Global/PageTransition/ColumnWipe/types/columnWipe";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXX Page Transition Link Component XXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const ColumnWipePageTransitionLink = ({
    href,
    target,
    children,
    className,
    ariaLabel,
    ...props
}: IColumnWipePageTransition.ILinkProps) => {
    const router = useRouter();
    const pathname = usePathname();

    const handleTransition = (e: React.MouseEvent<HTMLAnchorElement>) => {
        const targetPath = href.toString();
        const isExternal = target === "_blank";
        
        // 1. Logic Check: Same Page or New Tab
        // If the user clicks the current page OR opens in a new tab, 
        // we skip the animation logic and let the default Link behavior happen.
        if (targetPath === pathname || targetPath === `${pathname}/` || isExternal) return;

        // 2. Prevent default navigation for valid transitions
        e.preventDefault();
        
        // 3. Trigger the Pixel Wave
        const tl = runColumnWipeAnimation();
        
        // 4. Navigate only when the "curtain" is fully closed (pixels cover screen)
        tl.eventCallback("onComplete", () => {
            router.push(targetPath);
        });
    };

    return (
        <Link
            {...props}
            href={href}
            className={className}
            aria-label={ariaLabel}
            target={target || "_self"}
            onClick={handleTransition}
        >
            {children}
        </Link>
    );
};

ColumnWipePageTransitionLink.displayName = 'ColumnWipePageTransitionLink';

export default ColumnWipePageTransitionLink;