/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */
import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variable XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const EMAIL_USER: string | undefined = process.env.EMAIL_USER;
const EMAIL_PASS: string | undefined = process.env.EMAIL_PASS;
const EMAIL_HOST: string | undefined = process.env.EMAIL_HOST;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Well-Known Service Shorthands XXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Nodemailer resolves these by name (via its own internal host/port/secure lookup)
// when passed as `service` rather than `host`. Many creators only have a Gmail inbox
// for business email, and `.env.example` documents EMAIL_HOST="gmail" as a valid
// value — but "gmail" isn't a real SMTP hostname, so passing it through as `host`
// (the previous behavior) fails to resolve. This list is intentionally small: an
// EMAIL_HOST that isn't on it just falls through to being treated as a literal SMTP
// hostname, which is exactly today's existing behavior — this only adds support for
// the handful of common shorthands, it doesn't remove any.
const WELL_KNOWN_SERVICES = new Set([
	"gmail",
	"outlook365",
	"hotmail",
	"yahoo",
	"icloud",
	"zoho",
]);

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX SMTP Transport XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IEmailTransporter = nodemailer.Transporter<SMTPTransport.SentMessageInfo, SMTPTransport.Options>;

let cachedTransporter: IEmailTransporter | null = null;

/**
 * Lazily creates (and caches) the SMTP transporter used to send contact-form emails.
 * The env-var check happens here, at first call, rather than at module load — a page
 * or build step that never sends email shouldn't crash just because SMTP credentials
 * aren't configured yet for a given client fork.
 *
 * If `EMAIL_HOST` matches a well-known service name (e.g. "gmail"), the transporter is
 * configured via nodemailer's `service` option instead of `host`, so Gmail-only
 * creators work correctly. Note: Gmail requires an App Password (not the account
 * password) when 2FA is enabled — a regular password will fail auth.
 *
 * @throws {Error} If EMAIL_USER, EMAIL_PASS, or EMAIL_HOST aren't set.
 * @returns The shared nodemailer transporter instance.
 */
export const getEmailTransporter = (): IEmailTransporter => {
	if (cachedTransporter) {
		return cachedTransporter;
	}

	if (!EMAIL_USER || !EMAIL_PASS || !EMAIL_HOST) {
		throw new Error("SMTP environment variables (EMAIL_USER, EMAIL_PASS, EMAIL_HOST) must be set for the email transporter.");
	}

	const isWellKnownService = WELL_KNOWN_SERVICES.has(EMAIL_HOST.toLowerCase());

	cachedTransporter = nodemailer.createTransport({
		...(isWellKnownService
			? { service: EMAIL_HOST }
			: { host: EMAIL_HOST, port: 587, secure: false }),
		auth: {
			user: EMAIL_USER,
			pass: EMAIL_PASS,
		},
		tls: { rejectUnauthorized: false },
	});

	return cachedTransporter;
};
