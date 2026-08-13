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

// Escapes '<' so schema values sourced from third-party content (e.g. a video title
// containing "</script>") can't break out of the tag — Next.js's documented mitigation
// for injecting JSON-LD via dangerouslySetInnerHTML.
const escapeForScriptTag = (json: string): string => json.replace(/</g, "\\u003c");

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX StructuredData Component XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Renders one or more schema.org objects as <script type="application/ld+json"> tags.
// Plain server component — JSON-LD needs no client-side JS to be read by crawlers.
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
