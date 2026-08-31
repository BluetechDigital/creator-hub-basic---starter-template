'use client';

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { useState } from "react";
import useGlobalContext from "@/context/global";
import {
	SiFacebook,
	SiX,
	SiLine,
	SiSpotify,
	SiSnapchat,
	SiDiscord,
	SiTiktok,
	SiTwitch,
	SiThreads,
	SiPinterest,
	SiReddit,
	SiWhatsapp,
	SiWechat,
} from "react-icons/si";
import { FaLinkedin } from "react-icons/fa6";
import type { IconType } from "react-icons";
import type { ISinglePostDict } from "@/app/[locale]/posts/[slug]/types/singlePost";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/app/[locale]/posts/[slug]/styles/SinglePost.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Social Platform Registry XXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// The subset of IThemesOptions.IProps whose value is a social-link field
// (url/title/target) — not the whole IProps, which also has plain string
// fields (email, address, ...) and the differently-shaped errorPageContent.
type ISocialLinkKey =
	| "facebookLink" | "twitterLink" | "linkedinLink" | "tiktokLink" | "twitchLink"
	| "discordLink" | "threadsLink" | "pinterestLink" | "snapchatLink" | "redditLink"
	| "spotifyLink" | "lineLink" | "whatsappLink" | "wechatLink";

// Every social link field getThemesOptionsContent fetches (see
// graphql/CMS/types/themesOptions.ts), paired with its icon and a label for
// the aria-label. Rendered only when the creator has actually filled the link
// in, so this list updates itself — past and future articles alike — the
// moment theme options change, with no per-post editing required.
/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IShareLinks = {
	/** Only `copyLink`/`linkCopied` are read — passed down unstripped from `page.tsx` (see `ISinglePostDict`'s doc comment). */
	dict: Pick<ISinglePostDict, "copyLink" | "linkCopied">;
};

const SOCIAL_PLATFORMS: { key: ISocialLinkKey; label: string; Icon: IconType }[] = [
	{ key: "facebookLink", label: "Facebook", Icon: SiFacebook },
	{ key: "twitterLink", label: "X", Icon: SiX },
	{ key: "linkedinLink", label: "LinkedIn", Icon: FaLinkedin },
	{ key: "tiktokLink", label: "TikTok", Icon: SiTiktok },
	{ key: "twitchLink", label: "Twitch", Icon: SiTwitch },
	{ key: "discordLink", label: "Discord", Icon: SiDiscord },
	{ key: "threadsLink", label: "Threads", Icon: SiThreads },
	{ key: "pinterestLink", label: "Pinterest", Icon: SiPinterest },
	{ key: "snapchatLink", label: "Snapchat", Icon: SiSnapchat },
	{ key: "redditLink", label: "Reddit", Icon: SiReddit },
	{ key: "spotifyLink", label: "Spotify", Icon: SiSpotify },
	{ key: "lineLink", label: "Line", Icon: SiLine },
	{ key: "whatsappLink", label: "WhatsApp", Icon: SiWhatsapp },
	{ key: "wechatLink", label: "WeChat", Icon: SiWechat },
];

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX ShareLinks Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Copy-link button plus the creator's own active social profile links — reads
 * `themesOptionsContent` from `GlobalContext` (populated once in `app/[locale]/layout.tsx`,
 * see `context/global.ts`), the same theme options data already used for
 * `buildPersonSchema`'s JSON-LD `sameAs`, rather than fetching it again here. Only
 * platforms with a filled-in URL render an icon. `'use client'` for the
 * copy-to-clipboard button's click state and for reading `GlobalContext`.
 * @param dict This route's `singlePost` dictionary slice — `page.tsx` fetches
 * it once and passes it down, since a Client Component can't call `getDictionary()` itself.
 */
const ShareLinks = ({ dict }: IShareLinks) => {
	const [copied, setCopied] = useState(false);
	const { themesOptionsContent } = useGlobalContext();

	const handleCopyLink = async () => {
		try {
			// window.location.href, not a prop built from SITE_URL — this only ever
			// runs after hydration (user click), so the browser's own current URL is
			// always correct, unlike SITE_URL which can be unset in some environments.
			await navigator.clipboard.writeText(window.location.href);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.log(error);
		}
	};

	const activeSocialLinks = SOCIAL_PLATFORMS
		.map(({ key, label, Icon }) => ({ label, Icon, field: themesOptionsContent?.[key] }))
		.filter((platform): platform is typeof platform & { field: NonNullable<typeof platform["field"]> } =>
			Boolean(platform.field?.url),
		);

	return (
		<div className={styles.shareLinks}>
			<button type="button" onClick={handleCopyLink} className={styles.copyLinkButton}>
				{copied ? dict.linkCopied : dict.copyLink}
			</button>
			{activeSocialLinks.length > 0 && (
				<div className={styles.shareIcons}>
					{activeSocialLinks.map(({ label, Icon, field }) => (
						<a
							key={label}
							href={field.url}
							target={field.target || "_blank"}
							rel="noopener noreferrer"
							aria-label={label}
							className={styles.shareIconLink}
						>
							<Icon size={18} />
						</a>
					))}
				</div>
			)}
		</div>
	);
};

ShareLinks.displayName = 'ShareLinks';

export default ShareLinks;
