/* -----------------------------------------------------------------------------
Fake backend for the E2E suite — one process serving:

  POST /graphql            fake WPGraphQL (see router.mjs)
  ALL  /youtube/*          fake YouTube Data API v3 (empty lists / one channel)
  POST /azure/translate    fake Azure Translator — echoes each string, "[<loc>] "
                           prefixed, so specs can assert a non-en page translated
  GET  /wp-content/uploads/* fake WP media library — the CMS-media-proxy spec's
                           fixture post links to a "PDF" here; also exercises
                           the never-hit-this-directly assumption the proxy
                           route (app/api/media/[...path]/route.ts) is built on
  GET  /__health           readiness probe (Playwright waits on this)
  POST /__reset            clears the GraphQL request log + SMTP inbox
  GET  /__graphql-log      the recorded GraphQL requests (op + variables)
  GET  /__inbox            captured SMTP messages

Every response for a query wired into `next: { revalidate: 86400 }` is only
"live" for the first request in a given `next dev` process's life — Next's
Data Cache serves every identical later request from cache without ever
reaching this server. Playwright's own webServer readiness probe (GET /en)
already makes that first request before any spec runs, so a spec cannot
change the Home page's rendered fixture content mid-run this way (confirmed
live — see cms-pipeline.spec.ts's file doc comment). Slugs this server has
never seen before (broken-page, or any slug a spec is first to request) are
unaffected.

Plus a fake SMTP server on SMTP_PORT so the contact form's transporter connects.

No real credentials, no outbound network.
----------------------------------------------------------------------------- */

import http from "node:http";
import { SMTPServer } from "smtp-server";
import { GRAPHQL_PORT, SMTP_PORT } from "./env.mjs";
import { routeGraphql, graphqlLog, resetGraphqlLog } from "./router.mjs";
import { YT_EMPTY_LIST, YT_CHANNEL } from "./data.mjs";

/* ----------------------------------- SMTP ---------------------------------- */

const inbox = [];

// nodemailer RFC 2047-encodes a header value that isn't plain ASCII (this
// project's contact-confirmation subject has an em dash) as
// `=?UTF-8?Q?...?=` — decode it here so /__inbox and spec assertions see the
// actual text rather than the wire encoding.
const decodeMimeHeader = (value) =>
	value.replace(/=\?UTF-8\?Q\?([^?]*)\?=/gi, (_match, encoded) =>
		Buffer.from(encoded.replace(/_/g, " ").replace(/=([0-9A-F]{2})/gi, (_m, hex) => String.fromCharCode(parseInt(hex, 16))), "binary").toString("utf8"),
	);

const smtp = new SMTPServer({
	authOptional: true,
	disabledCommands: ["STARTTLS"],
	onAuth(_auth, _session, cb) { cb(null, { user: "e2e" }); },
	onData(stream, _session, cb) {
		let raw = "";
		stream.on("data", (c) => (raw += c));
		stream.on("end", () => {
			const header = (name) => decodeMimeHeader((raw.match(new RegExp(`^${name}:\\s*(.*)$`, "im")) ?? [])[1]?.trim() ?? "");
			inbox.push({ to: header("To"), from: header("From"), subject: header("Subject"), raw });
			cb();
		});
	},
});
smtp.on("error", (err) => console.error("[fixture smtp]", err.message));
smtp.listen(SMTP_PORT, () => console.log(`[fixture] SMTP on :${SMTP_PORT}`));

/* ----------------------------------- HTTP ---------------------------------- */

const json = (res, status, obj) => {
	res.writeHead(status, { "Content-Type": "application/json" });
	res.end(JSON.stringify(obj));
};

const readBody = (req) =>
	new Promise((resolve) => {
		let raw = "";
		req.on("data", (c) => (raw += c));
		req.on("end", () => {
			try { resolve(raw ? JSON.parse(raw) : {}); }
			catch { resolve({}); }
		});
	});

const server = http.createServer(async (req, res) => {
	const url = new URL(req.url, `http://localhost:${GRAPHQL_PORT}`);
	const path = url.pathname;

	// --- control endpoints ---
	if (path === "/__health") return json(res, 200, { ok: true });
	if (path === "/__graphql-log") return json(res, 200, graphqlLog);
	if (path === "/__inbox") return json(res, 200, inbox);
	if (path === "/__reset" && req.method === "POST") {
		resetGraphqlLog();
		inbox.length = 0;
		return json(res, 200, { ok: true });
	}

	// --- fake WPGraphQL ---
	if (path === "/graphql" && req.method === "POST") {
		const body = await readBody(req);
		const { status, body: responseBody } = routeGraphql(body);
		return json(res, status, responseBody);
	}

	// --- fake Azure Translator ---
	if (path === "/azure/translate" && req.method === "POST") {
		const to = url.searchParams.get("to") ?? "xx";
		const body = await readBody(req); // [{ Text: "..." }]
		const out = (Array.isArray(body) ? body : []).map((entry) => ({
			translations: [{ text: `[${to}] ${entry?.Text ?? ""}`, to }],
		}));
		return json(res, 200, out);
	}

	// --- fake YouTube Data API ---
	if (path.startsWith("/youtube/")) {
		if (path.endsWith("/channels")) return json(res, 200, YT_CHANNEL);
		return json(res, 200, YT_EMPTY_LIST);
	}

	// --- fake WP media library ---
	// A real WordPress upload — the exact thing app/api/media/[...path]/route.ts
	// proxies. cms-pipeline.spec.ts's fixture post links to one of these
	// directly (never through the app/api/media proxy) to prove the proxy is
	// the ONLY path a visitor's browser ever reaches this from.
	if (path.startsWith("/wp-content/uploads/")) {
		res.writeHead(200, { "Content-Type": "application/pdf" });
		return res.end("%PDF-1.4 fixture document bytes");
	}

	console.warn(`[fixture] unhandled ${req.method} ${path}`);
	return json(res, 404, { error: `no fixture route for ${req.method} ${path}` });
});

server.listen(GRAPHQL_PORT, () => console.log(`[fixture] GraphQL/HTTP on :${GRAPHQL_PORT}`));

const shutdown = () => {
	server.close();
	smtp.close();
	process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
