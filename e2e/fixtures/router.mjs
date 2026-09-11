/* -----------------------------------------------------------------------------
Routes an incoming WPGraphQL request body to a canned response. The app never
sends `operationName` (every `graphql/CMS/*.ts` call posts just `{query,
variables}`), so every branch here matches on the query string's own `query
Name(...)`/`mutation Name(...)` header — exact operation names, confirmed
against each `graphql/CMS/*.ts` file, not guesswork substrings. Every request
is pushed to `graphqlLog` for spec assertions ("no mutation was fired" on the
honeypot / validation paths).
----------------------------------------------------------------------------- */

import {
	PAGE_BLOCKS, pageFieldGroupNames, seoFor, filterPosts, FILTER_OPTIONS,
	postBySlug, COMMENTS_EMPTY, THEME_OPTIONS_EMPTY, MENU_LINKS_EMPTY,
	PAGE_SLUGS, POST_SLUGS,
} from "./data.mjs";

export const graphqlLog = [];
export const resetGraphqlLog = () => { graphqlLog.length = 0; };

const ok = (data) => ({ status: 200, body: { data } });
const gqlError = (message) => ({ status: 200, body: { errors: [{ message }] } });

const opName = (query) => {
	const m = query.match(/\b(?:query|mutation)\s+(\w+)/);
	return m ? m[1] : "(anonymous)";
};

/**
 * @param {{query?: string, variables?: Record<string, unknown>}} req
 */
export function routeGraphql(req) {
	const query = req.query ?? "";
	const variables = req.variables ?? {};
	const op = opName(query);
	const slug = typeof variables.slug === "string" ? variables.slug : undefined;

	graphqlLog.push({ op, variables });

	// --- The broken-page fixture: a GraphQL schema error ---------------------
	if (slug === "broken-page") {
		return gqlError("Simulated schema error for the broken-page fixture.");
	}

	switch (op) {
		// --- ACF flexible-content pipeline (Pass 1 + Pass 2) -----------------
		case "GetFieldGroupNames": {
			if (!(slug in PAGE_BLOCKS)) return ok({ flexibleComponents: { edges: [] } });
			return ok({ flexibleComponents: { edges: [{ node: { template: { flexibleContent: { flexibleContent: pageFieldGroupNames(slug) } } } }] } });
		}
		case "GetPageFlexibleComponentsContent": {
			if (!(slug in PAGE_BLOCKS)) return ok({ flexibleComponents: { edges: [] } });
			return ok({ flexibleComponents: { edges: [{ node: { template: { flexibleContent: { flexibleContent: PAGE_BLOCKS[slug] } } } }] } });
		}

		// --- SEO ---------------------------------------------------------
		case "GetAllSeoContent":
			return ok({ seo: { edges: [{ node: { seo: seoFor(slug ?? "Home") } }] } });

		// --- Posts: summaries / latest / filters / single ------------------
		case "GetAllPostsSummaries":
			return ok({ posts: filterPosts(variables) });
		case "GetLatestPosts":
			return ok({ posts: filterPosts({ first: variables.first ?? 3 }).nodes });
		case "GetPostFilterOptions":
			return ok(FILTER_OPTIONS);
		case "GetPostContentBySlug":
			return ok({ posts: { edges: [{ node: postBySlug(slug ?? "fixture-post") }] } });

		// --- Comments + reactions ------------------------------------------
		case "GetPostComments":
			return ok({ post: COMMENTS_EMPTY });
		case "GetPostReactions":
		case "GetCommentReactions":
			// Fail-soft: both callers treat missing data as "no reactions yet"
			// (the mu-plugin not installed is an expected state, not an error).
			return ok({});

		// --- Mutations -----------------------------------------------------
		case "CreateComment":
			return ok({ createComment: { success: true } });
		case "SetPostReaction":
			return ok({ setPostReaction: { likes: 1, dislikes: 0 } });
		case "SetCommentReaction":
			return ok({ setCommentReaction: { likes: 1, dislikes: 0 } });

		default:
			break;
	}

	// --- Theme options / menu links (anonymous queries) ---------------------
	if (query.includes('themeOptions(where: {name: "Global Content"')) {
		return ok({ themeOptions: THEME_OPTIONS_EMPTY });
	}
	if (query.includes("menuItems(where:")) {
		return ok({ menuLinks: MENU_LINKS_EMPTY });
	}

	// --- Sitemap slug queries (anonymous) -----------------------------------
	if (query.includes("pages(where: {status: PUBLISH}")) {
		return ok({ pages: { nodes: PAGE_SLUGS } });
	}
	if (query.includes("posts(where: {status: PUBLISH}")) {
		return ok({ posts: { nodes: POST_SLUGS } });
	}

	// --- Unmatched -----------------------------------------------------
	console.warn(`[fixture] no GraphQL route for op=${op} — returning empty data`);
	return ok(null);
}
