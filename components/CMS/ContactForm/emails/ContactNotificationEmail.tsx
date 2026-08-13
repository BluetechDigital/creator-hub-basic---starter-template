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
	email: string;
	message: string;
	siteName?: string;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXX ContactNotificationEmail Component XXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * "Receiver" email — notifies the site owner of a new contact-form submission,
 * sent to `CONTACT_FORM_RECIPIENT_EMAIL` (see `ContactForm/actions.ts`). Rendered to
 * HTML via `@react-email/components`'s `render()` before being handed to nodemailer.
 */
const ContactNotificationEmail: FC<IProps> = ({ name, email, message, siteName }) => (
	<EmailLayout previewText={`New message from ${name}`} siteName={siteName}>
		<Heading as="h2">New contact form submission</Heading>
		<Text><strong>Name:</strong> {name}</Text>
		<Text><strong>Email:</strong> {email}</Text>
		<Text><strong>Message:</strong></Text>
		<Text>{message}</Text>
	</EmailLayout>
);

ContactNotificationEmail.displayName = 'ContactNotificationEmail';

export default ContactNotificationEmail;
