/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC } from "react";
import { headers } from "next/headers";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IProps = {
	data: object | object[];
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Escaping Helper XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Escapes '<' so schema values sourced from third-party content (e.g. a video title
 * containing "</script>") can't break out of the tag — Next.js's documented mitigation
 * for injecting JSON-LD via `dangerouslySetInnerHTML`.
 * @param json A JSON string (typically from `JSON.stringify`) to make safe for
 * embedding inside a `<script>` tag's innerHTML.
 * @returns The same string with every literal `<` character replaced by its
 * unicode escape sequence.
 */
const escapeForScriptTag = (json: string): string => json.replace(/</g, "\\u003c");

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX StructuredData Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Renders one or more schema.org objects as `<script type="application/ld+json">` tags.
 * An async server component (not a plain one — JSON-LD needs no client-side JS to be
 * read by crawlers, but reading this request's CSP nonce below does need `await`) —
 * reads its own nonce via `headers()` (set per-request by `proxy.ts`) rather than
 * taking it as a prop, since every call site already renders this from a Server
 * Component (`app/[locale]/layout.tsx`, `app/[locale]/[slug]/page.tsx`,
 * `app/[locale]/posts/[slug]/page.tsx`), so there's nothing a prop would save. The CSP's
 * `script-src` only allows a `<script>` carrying this request's own nonce — without it
 * here, every JSON-LD tag this renders would be silently dropped by the browser, not
 * just unauthenticated (search engines would stop seeing this site's structured data
 * entirely).
 * @param data A single schema.org object, or an array of them to render as multiple
 * `<script>` tags.
 */
const StructuredData: FC<IProps> = async ({ data }) => {
	const items = Array.isArray(data) ? data : [data];
	const nonce = (await headers()).get("x-nonce");

	return (
		<>
			{items.map((item, index) => (
				<script
					key={index}
					type="application/ld+json"
					nonce={nonce ?? undefined}
					dangerouslySetInnerHTML={{ __html: escapeForScriptTag(JSON.stringify(item)) }}
				/>
			))}
		</>
	);
};

StructuredData.displayName = 'StructuredData';

export default StructuredData;
