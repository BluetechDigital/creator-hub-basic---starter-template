<?php
/**
 * Plugin Name: Creator Hub Security - GraphQL mutation gate and comment abuse controls
 * Description: Requires a shared proxy secret for every WPGraphQL mutation, rate-limits and screens anonymous comments, and pins WPGraphQL's exposure settings.
 * Version: 1.0.0
 * Author: Bluetech Digital Ltd
 * Author URI: https://bluetech-digital.co.uk
 *
 * Load this FIRST (its filename sorts before simple-blogs-post-likes.php, so mu-plugin
 * auto-load ordering already does that) - the likes plugin's mutations reuse the
 * helpers defined here.
 *
 * WHAT THIS CLOSES
 * ----------------
 * The WPGraphQL endpoint is public and `createComment` is anonymous, so without this
 * an attacker can POST a mutation straight to `/graphql` and skip the Next.js Server
 * Action entirely - meaning reCAPTCHA, input validation and Next's own CSRF/Origin
 * checks never run. This gate makes the Server Action the *only* way a mutation
 * reaches WordPress:
 *
 *   1. Every GraphQL mutation must carry an `X-Creator-Hub-Proxy-Secret` header whose
 *      value matches CREATOR_HUB_GRAPHQL_PROXY_SECRET. The Next.js server adds it from
 *      a server-only env var (see graphql/CMS/CreateComment.ts et al). Read queries
 *      are untouched - the site's ISR/build needs them public.
 *   2. Anonymous comments (regardless of channel) are per-IP rate limited, screened
 *      for staff-name impersonation, and rejected for link flooding.
 *   3. WPGraphQL's introspection / GraphiQL IDE / batching / query-depth settings are
 *      pinned from code so a wp-admin user can't loosen them by accident.
 *
 * INSTALL
 * -------
 *   1. Copy this file into wp-content/mu-plugins/ (create the folder if needed).
 *   2. Add to wp-config.php, ABOVE the "That's all, stop editing" line:
 *          define( 'CREATOR_HUB_GRAPHQL_PROXY_SECRET', '<a long random string>' );
 *      (or set a CREATOR_HUB_GRAPHQL_PROXY_SECRET environment variable on the host).
 *   3. Set the SAME value as CREATOR_HUB_GRAPHQL_PROXY_SECRET in the Next.js app's env.
 *
 * Until the secret is configured this fails OPEN (mutations still work) but writes a
 * loud line to the PHP error log on every mutation - a half-configured deploy is
 * noisy, not silently broken. Requires WPGraphQL to be active.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/* -----------------------------------------------------------------------------
 * Helpers
 * -------------------------------------------------------------------------- */

/**
 * The real visitor IP. WordPress sits behind a CDN (Cloudflare / Vercel), so
 * REMOTE_ADDR is the edge node, not the visitor - a per-IP rate limit keyed on it
 * would be per-edge (useless) or global (a shared limit for everyone). Prefer the
 * CDN's trusted client-IP header.
 *
 * SECURITY: these headers are only trustworthy if the WordPress origin is NOT
 * directly reachable (locked to the CDN's IP range at the host firewall) - see
 * docs/comment-security.md. If the origin is exposed, an attacker sets the header
 * themselves. REMOTE_ADDR is the safe fallback either way.
 */
function ch_client_ip() {
	foreach ( array( 'HTTP_CF_CONNECTING_IP', 'HTTP_TRUE_CLIENT_IP', 'HTTP_X_REAL_IP' ) as $header ) {
		if ( ! empty( $_SERVER[ $header ] ) ) {
			$candidate = trim( sanitize_text_field( wp_unslash( $_SERVER[ $header ] ) ) );
			if ( filter_var( $candidate, FILTER_VALIDATE_IP ) ) {
				return $candidate;
			}
		}
	}

	if ( ! empty( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) {
		$parts     = explode( ',', wp_unslash( $_SERVER['HTTP_X_FORWARDED_FOR'] ) );
		$candidate = trim( sanitize_text_field( $parts[0] ) );
		if ( filter_var( $candidate, FILTER_VALIDATE_IP ) ) {
			return $candidate;
		}
	}

	return isset( $_SERVER['REMOTE_ADDR'] )
		? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) )
		: 'unknown';
}

/**
 * The expected proxy secret, from the wp-config constant (preferred) or an
 * environment variable. Empty string means "not configured".
 */
function ch_graphql_proxy_secret() {
	if ( defined( 'CREATOR_HUB_GRAPHQL_PROXY_SECRET' ) && '' !== CREATOR_HUB_GRAPHQL_PROXY_SECRET ) {
		return (string) CREATOR_HUB_GRAPHQL_PROXY_SECRET;
	}
	$env = getenv( 'CREATOR_HUB_GRAPHQL_PROXY_SECRET' );
	return false !== $env ? (string) $env : '';
}

/**
 * Whether this request is allowed to run a GraphQL mutation. True when the
 * `X-Creator-Hub-Proxy-Secret` header matches, or (fail-open) when no secret is
 * configured yet - the latter also logs a warning so it can't pass unnoticed.
 */
function ch_request_is_trusted_proxy() {
	$expected = ch_graphql_proxy_secret();

	if ( '' === $expected ) {
		error_log( 'Creator Hub Security: CREATOR_HUB_GRAPHQL_PROXY_SECRET is not set - GraphQL mutations are NOT gated. Set it in wp-config.php.' );
		return true;
	}

	$provided = isset( $_SERVER['HTTP_X_CREATOR_HUB_PROXY_SECRET'] )
		? trim( sanitize_text_field( wp_unslash( $_SERVER['HTTP_X_CREATOR_HUB_PROXY_SECRET'] ) ) )
		: '';

	return '' !== $provided && hash_equals( $expected, $provided );
}

/**
 * Detects whether a raw GraphQL query string's operation is a mutation - strips
 * leading `#` comments and whitespace, then checks the first keyword. A query that
 * merely mentions "mutation" in a field/fragment name is not matched.
 */
function ch_query_is_mutation( $query ) {
	if ( ! is_string( $query ) || '' === $query ) {
		return false;
	}
	$stripped = preg_replace( '/^(?:\s*#[^\n]*\n)+/', '', ltrim( $query ) );
	return (bool) preg_match( '/^\s*mutation\b/i', (string) $stripped );
}

/* -----------------------------------------------------------------------------
 * 1. Gate every GraphQL mutation behind the proxy secret
 * -------------------------------------------------------------------------- */

add_action(
	'graphql_before_execute',
	function ( $request ) {
		$params = isset( $request->params ) ? $request->params : null;
		if ( ! $params ) {
			return;
		}

		$batch = is_array( $params ) ? $params : array( $params );

		foreach ( $batch as $entry ) {
			$query = '';
			if ( is_object( $entry ) && isset( $entry->query ) ) {
				$query = $entry->query;
			} elseif ( is_array( $entry ) && isset( $entry['query'] ) ) {
				$query = $entry['query'];
			}

			if ( ch_query_is_mutation( $query ) ) {
				if ( ! ch_request_is_trusted_proxy() ) {
					throw new \GraphQL\Error\UserError( 'This operation is not allowed.' );
				}
				return;
			}
		}
	}
);

/* -----------------------------------------------------------------------------
 * 2. Anonymous-comment abuse controls
 *
 * `preprocess_comment` runs inside wp_new_comment() for every channel (GraphQL,
 * REST, wp-comments-post.php). Scope to anonymous GraphQL submissions so an editor
 * replying from wp-admin is never rate limited or screened.
 * -------------------------------------------------------------------------- */

/**
 * Per-IP: at most one comment every 30s and 5 per rolling hour.
 */
function ch_enforce_comment_rate_limit() {
	$ip         = ch_client_ip();
	$burst_key  = 'ch_cmt_burst_' . md5( $ip );
	$hourly_key = 'ch_cmt_hourly_' . md5( $ip );

	if ( get_transient( $burst_key ) ) {
		throw new \GraphQL\Error\UserError( 'You are commenting too quickly - please wait a moment and try again.' );
	}

	$hourly = (int) get_transient( $hourly_key );
	if ( $hourly >= 5 ) {
		throw new \GraphQL\Error\UserError( 'You have reached the comment limit for now - please try again later.' );
	}

	set_transient( $burst_key, 1, 30 );
	set_transient( $hourly_key, $hourly + 1, HOUR_IN_SECONDS );
}

/**
 * Rejects author names that impersonate site staff or an existing WordPress user -
 * comments are auto-approved here, so a name like the site's own brand or a real
 * editor's display name going live unchecked is a real risk. The generic terms
 * below are static; the site's own name (from wp-admin -> Settings -> General,
 * split into words) is checked too, so this stays useful without editing PHP for
 * every client site built from this template.
 */
function ch_reject_impersonating_author( $name ) {
	$name = strtolower( trim( (string) $name ) );
	if ( '' === $name ) {
		return;
	}

	$blocked = array(
		'admin', 'administrator', 'moderator', 'webmaster', 'root', 'system',
		'staff', 'support', 'official', 'team', 'no-reply', 'noreply',
	);

	$site_name = strtolower( trim( wp_strip_all_tags( get_bloginfo( 'name' ) ) ) );
	if ( '' !== $site_name ) {
		$blocked[] = $site_name;
		foreach ( preg_split( '/\s+/', $site_name ) as $word ) {
			// Skip short/common words ("the", "hub") so a site named e.g. "The
			// Creator Hub" doesn't block every comment mentioning "hub".
			if ( mb_strlen( $word ) >= 4 ) {
				$blocked[] = $word;
			}
		}
	}

	foreach ( $blocked as $term ) {
		if ( $name === $term || preg_match( '/\b' . preg_quote( $term, '/' ) . '\b/u', $name ) ) {
			throw new \GraphQL\Error\UserError( 'Please comment under your own name.' );
		}
	}

	$matches = get_users(
		array(
			'number'         => 1,
			'fields'         => 'ID',
			'search'         => $name,
			'search_columns' => array( 'display_name', 'user_login', 'user_nicename' ),
		)
	);
	if ( ! empty( $matches ) ) {
		throw new \GraphQL\Error\UserError( 'Please comment under your own name.' );
	}
}

/**
 * Rejects link-flooded comment bodies (spam / SEO / phishing). More than two URLs
 * in one comment is not a normal reader contribution.
 */
function ch_reject_link_flood( $content ) {
	if ( preg_match_all( '#https?://#i', (string) $content ) > 2 ) {
		throw new \GraphQL\Error\UserError( 'Please keep links in your comment to a minimum.' );
	}
}

add_filter(
	'preprocess_comment',
	function ( $commentdata ) {
		if ( ! defined( 'GRAPHQL_REQUEST' ) || ! GRAPHQL_REQUEST || is_user_logged_in() ) {
			return $commentdata;
		}

		if ( ! ch_request_is_trusted_proxy() ) {
			throw new \GraphQL\Error\UserError( 'Comments can only be submitted through the site.' );
		}

		ch_enforce_comment_rate_limit();
		ch_reject_impersonating_author( isset( $commentdata['comment_author'] ) ? $commentdata['comment_author'] : '' );
		ch_reject_link_flood( isset( $commentdata['comment_content'] ) ? $commentdata['comment_content'] : '' );

		return $commentdata;
	},
	5
);

/* -----------------------------------------------------------------------------
 * 3. Pin WPGraphQL exposure settings from code
 *
 * Forces the safe values regardless of what's toggled in wp-admin -> GraphQL.
 * -------------------------------------------------------------------------- */

add_filter(
	'graphql_get_setting_section_field_value',
	function ( $value, $default_value, $field_name, $section_fields, $section_name ) {
		if ( 'graphql_general_settings' !== $section_name ) {
			return $value;
		}

		$pinned = array(
			'public_introspection_enabled' => 'off',
			'show_graphiql_ide'            => 'off',
			'graphiql_enabled'             => 'off',
			'batch_queries_enabled'        => 'off',
			'query_depth_enabled'          => 'on',
			'query_depth_max'              => 10,
			'tracing_enabled'              => 'off',
			'query_logs_enabled'           => 'off',
		);

		return array_key_exists( $field_name, $pinned ) ? $pinned[ $field_name ] : $value;
	},
	10,
	5
);
