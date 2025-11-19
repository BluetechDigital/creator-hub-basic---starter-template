/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */
import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variable XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Access variables directly and store them
const EMAIL_USER: string | undefined = process.env.EMAIL_USER;
const EMAIL_PASS: string | undefined = process.env.EMAIL_PASS;
const EMAIL_HOST: string | undefined = process.env.EMAIL_HOST;

// Perform a defensive check early (Crucial for server code)
if (!EMAIL_USER || !EMAIL_PASS || !EMAIL_HOST) {
    throw new Error("SMTP environment variables (EMAIL_USER, EMAIL_PASS, EMAIL_HOST) must be set for the email transporter.");
}

const host = EMAIL_HOST;
const email = EMAIL_USER;
const password = EMAIL_PASS;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX SMTP Transport XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Create reusable transporter object using the default SMTP transport
export const emailTransporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo, SMTPTransport.Options> = nodemailer.createTransport({
	host: host,
	port: 587,
	secure: false,
	auth: {
		user: email,
		pass: password,
	},
	tls: {rejectUnauthorized: false},
	logger: true,
	debug: true,
});

// Verify connection configuration
emailTransporter.verify(function (error: Error | null) {
	if (error) {
		console.log("Connection error:", error);
	} else {
		console.log("Server is ready to take our messages");
	}
});
