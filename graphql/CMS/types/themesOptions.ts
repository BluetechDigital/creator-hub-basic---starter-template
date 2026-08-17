/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX CUSTOM POST TYPES XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export type IResponse = {
    themeOptions: {
        edges: Array<{
            node: {
                themeOptions: IProps;
            } | null;
        } | null> | null;
    } | null;
} | null;

type IFields = {
    url: string;
	title: string;
	target: string;
};

/**
 * ACF field values for the "Global Content" theme options page (contact
 * details, social links, error-page content) — kept in sync with exactly what
 * `getThemesOptionsContent` in `GetAllThemesOptions.ts` fetches.
 */
export type IProps = {
	email: string;
	address: string;
	emailTwo: string;
	phoneNumber: string;
	copyrightText: string;
    phoneNumberTwo: string;

    // Error Page Content
	errorPageContent: {
		title: string;
		paragraph: string;
		buttonLink: IFields;
		backgroundImage: {
			altText: string;
			sourceUrl: string;
			mediaDetails: {
				width: number;
				height: number;
			};
		};
    };

    // Social Media Links
	tiktokLink: IFields;
	twitchLink: IFields;
    redditLink: IFields;
	twitterLink: IFields;
	spotifyLink: IFields;
	threadsLink: IFields;
	discordLink: IFields;
	facebookLink: IFields;
	linkedinLink: IFields;
	snapchatLink: IFields;
	pinterestLink: IFields;
	lineLink: IFields;
	whatsappLink: IFields;
	wechatLink: IFields;
};
