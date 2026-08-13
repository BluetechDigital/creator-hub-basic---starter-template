/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC } from "react";

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
 * A plain server component — JSON-LD needs no client-side JS to be read by crawlers.
 * @param data A single schema.org object, or an array of them to render as multiple
 * `<script>` tags.
 */
const StructuredData: FC<IProps> = ({ data }) => {
	const items = Array.isArray(data) ? data : [data];

	return (
		<>
			{items.map((item, index) => (
				<script
					key={index}
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: escapeForScriptTag(JSON.stringify(item)) }}
				/>
			))}
		</>
	);
};

StructuredData.displayName = 'StructuredData';

export default StructuredData;
