/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC } from "react";
import { Heading, Text } from "@react-email/components";
import EmailLayout from "@/components/CMS/ContactForm/emails/EmailLayout";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IProps = {
	name: string;
	siteName?: string;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXX ContactConfirmationEmail Component XXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * "Sender" email — auto-reply confirmation sent back to whoever submitted the
 * contact form (see `ContactForm/actions.ts`), so they know their message went
 * through without needing the site owner to respond first.
 */
const ContactConfirmationEmail: FC<IProps> = ({ name, siteName }) => (
	<EmailLayout previewText="We've received your message" siteName={siteName}>
		<Heading as="h2">Thanks for reaching out{name ? `, ${name}` : ""}!</Heading>
		<Text>
			We&apos;ve received your message{siteName ? ` at ${siteName}` : ""} and will get back to you
			as soon as possible.
		</Text>
	</EmailLayout>
);

ContactConfirmationEmail.displayName = 'ContactConfirmationEmail';

export default ContactConfirmationEmail;
