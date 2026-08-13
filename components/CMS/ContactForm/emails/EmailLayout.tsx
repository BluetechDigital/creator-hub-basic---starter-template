/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, ReactNode } from "react";
import { Html, Head, Body, Container, Section, Text, Hr, Preview } from "@react-email/components";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IProps = {
	previewText: string;
	siteName?: string;
	children: ReactNode;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX EmailLayout Component XXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Shared structural layout for the contact-form emails (notification + confirmation)
 * — one standardized layout/spacing so every client fork's emails are visually
 * consistent, while `siteName` (sourced from the `SITE_NAME` env var, not hardcoded)
 * is the only branding input, keeping this generic across client forks rather than
 * containing any one creator's design.
 */
const EmailLayout: FC<IProps> = ({ previewText, siteName, children }) => (
	<Html>
		<Head />
		<Preview>{previewText}</Preview>
		<Body style={{ backgroundColor: "#f4f4f5", fontFamily: "Arial, sans-serif", padding: "24px 0" }}>
			<Container style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "8px", maxWidth: "560px" }}>
				{siteName ? (
					<Text style={{ fontSize: "14px", color: "#71717a", margin: "0 0 16px" }}>{siteName}</Text>
				) : null}
				<Section>{children}</Section>
				<Hr style={{ margin: "24px 0", borderColor: "#e4e4e7" }} />
				<Text style={{ fontSize: "12px", color: "#a1a1aa" }}>
					This email was sent via the contact form{siteName ? ` on ${siteName}` : ""}.
				</Text>
			</Container>
		</Body>
	</Html>
);

EmailLayout.displayName = 'EmailLayout';

export default EmailLayout;
