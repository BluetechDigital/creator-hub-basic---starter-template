/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Server-only — the shared secret must never reach a client bundle.
import "server-only";

const CREATOR_HUB_GRAPHQL_PROXY_SECRET: string | undefined = process.env.CREATOR_HUB_GRAPHQL_PROXY_SECRET;

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXX GraphQL Mutation Auth Header XXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

let warned = false;

/**
 * The `X-Creator-Hub-Proxy-Secret` header the WordPress `ch-security.php`
 * mu-plugin requires on every GraphQL mutation — proof the write originated
 * from this server rather than a direct hit on the public `/graphql` endpoint
 * (which would otherwise skip the comment/reaction Server Actions' reCAPTCHA,
 * validation and rate limiting entirely). See `docs/comment-security.md`.
 *
 * Spread into a mutation `fetch`'s `headers`. Returns `{}` when the secret
 * isn't configured yet — the mu-plugin also fails open in that state, so a
 * fork mid-setup still works — but warns once per process in production so a
 * misconfigured deploy is visible.
 *
 * Read queries deliberately do NOT send this header: the site's ISR/build
 * fetches must keep working against a public endpoint.
 */
export const graphqlMutationHeaders = (): Record<string, string> => {
	if (!CREATOR_HUB_GRAPHQL_PROXY_SECRET) {
		if (!warned && process.env.NODE_ENV === "production") {
			warned = true;
			console.warn(
				"CREATOR_HUB_GRAPHQL_PROXY_SECRET is not set — GraphQL mutations are sent unauthenticated. " +
					"Set it here and as a matching wp-config constant (see wordpress-mu-plugins/README.md).",
			);
		}
		return {};
	}

	return { "X-Creator-Hub-Proxy-Secret": CREATOR_HUB_GRAPHQL_PROXY_SECRET };
};
