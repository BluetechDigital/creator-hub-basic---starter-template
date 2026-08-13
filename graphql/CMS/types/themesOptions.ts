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
 * details, social links, error-page content). Note: this doesn't fully mirror
 * the fields actually fetched by `getThemesOptionsContent` in
 * `GetAllThemesOptions.ts` — cross-check before assuming it's a complete contract.
 */
export type IProps = {
	email: string;
	address: string;
	emailTwo: string;
	textarea: string;
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
	youtubeLink: IFields;
	threadsLink: IFields;
	discordLink: IFields;
	facebookLink: IFields;
	linkedinLink: IFields;
	snapchatLink: IFields;
	instagramLink: IFields;
	pinterestLink: IFields;
    
};