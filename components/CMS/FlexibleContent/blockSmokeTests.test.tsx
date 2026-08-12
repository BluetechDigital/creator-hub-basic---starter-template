import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import type { ComponentType } from "react";

import Hero from "@/components/CMS/Hero/Hero";
import heroStyles from "@/components/CMS/Hero/styles/Hero.module.css";
import HeroTwo from "@/components/CMS/HeroTwo/HeroTwo";
import heroTwoStyles from "@/components/CMS/HeroTwo/styles/HeroTwo.module.css";
import AboutUs from "@/components/CMS/AboutUs/AboutUs";
import aboutUsStyles from "@/components/CMS/AboutUs/styles/AboutUs.module.css";
import CallToAction from "@/components/CMS/CallToAction/CallToAction";
import callToActionStyles from "@/components/CMS/CallToAction/styles/CallToAction.module.css";
import CallToActionTwo from "@/components/CMS/CallToActionTwo/CallToActionTwo";
import callToActionTwoStyles from "@/components/CMS/CallToActionTwo/styles/CallToActionTwo.module.css";
import ContactForm from "@/components/CMS/ContactForm/ContactForm";
import contactFormStyles from "@/components/CMS/ContactForm/styles/ContactForm.module.css";
import CookiePolicies from "@/components/CMS/CookiePolicies/CookiePolicies";
import cookiePoliciesStyles from "@/components/CMS/CookiePolicies/styles/CookiePolicies.module.css";
import InstagramFeed from "@/components/CMS/InstagramFeed/InstagramFeed";
import instagramFeedStyles from "@/components/CMS/InstagramFeed/styles/InstagramFeed.module.css";
import PrivacyPolicies from "@/components/CMS/PrivacyPolicies/PrivacyPolicies";
import privacyPoliciesStyles from "@/components/CMS/PrivacyPolicies/styles/PrivacyPolicies.module.css";
import SponsorshipInfo from "@/components/CMS/SponsorshipInfo/SponsorshipInfo";
import sponsorshipInfoStyles from "@/components/CMS/SponsorshipInfo/styles/SponsorshipInfo.module.css";
import YoutubeVideoGrid from "@/components/CMS/YouTubeVideoGrid/YouTubeVideoGrid";
import youtubeVideoGridStyles from "@/components/CMS/YouTubeVideoGrid/styles/YouTubeVideoGrid.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX What this test is for XXXXXXXXXXXXXXXXXXXXXXXXXXX
These blocks are currently empty shells (design comes first, per the Figma-first
process — see ARCHITECTURE.md). There's no content behaviour to assert yet, but
this still buys real regression coverage: it proves each block imports cleanly,
renders without throwing given the CMS props every block receives in production
(__typename/fieldGroupName), and its root element carries the right CSS Module
class. As blocks get built out, replace an entry's assertion with real
prop-behaviour tests (see TitleParagraph.test.tsx for the pattern) rather than
leaving it here once it stops being an empty div.

AllYoutubeVideos/AllYoutubeShortsVideos are excluded — they're async Server
Components (they fetch data in their own function body) and React Testing
Library's render() does not support awaiting a Server Component today; that data
-fetching path is covered instead by their underlying api/YouTube functions'
own tests.
----------------------------------------------------------------------------- */

// A generic component map, same as DynamicComponentLoaders in RenderFlexibleContent.tsx —
// each block has its own (different) prop shape, so `any` here is intentional and scoped
// to this one array, not a general escape hatch.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const blocks: [name: string, Component: ComponentType<any>, rootClass: string][] = [
	["Hero", Hero, heroStyles.hero],
	["HeroTwo", HeroTwo, heroTwoStyles.heroTwo],
	["AboutUs", AboutUs, aboutUsStyles.aboutUs],
	["CallToAction", CallToAction, callToActionStyles.callToAction],
	["CallToActionTwo", CallToActionTwo, callToActionTwoStyles.callToActionTwo],
	["ContactForm", ContactForm, contactFormStyles.contactForm],
	["CookiePolicies", CookiePolicies, cookiePoliciesStyles.cookiePolicies],
	["InstagramFeed", InstagramFeed, instagramFeedStyles.instagramFeed],
	["PrivacyPolicies", PrivacyPolicies, privacyPoliciesStyles.privacyPolicies],
	["SponsorshipInfo", SponsorshipInfo, sponsorshipInfoStyles.sponsorshipInfo],
	["YoutubeVideoGrid", YoutubeVideoGrid, youtubeVideoGridStyles.youtubeVideoGrid],
];

const baseCMSProps = {
	__typename: "TestFieldGroup",
	fieldGroupName: "DefaultTemplate_Flexiblecontent_FlexibleContent_Test",
};

describe("CMS block components render without crashing", () => {
	it.each(blocks)("%s renders its root element with the CMS base props", (_name, Component, rootClass) => {
		const { container } = render(<Component {...baseCMSProps} />);

		expect(container.firstChild).toHaveClass(rootClass);
	});
});
