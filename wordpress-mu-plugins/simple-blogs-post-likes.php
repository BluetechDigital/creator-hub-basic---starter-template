<?php
/**
 * Plugin Name: Simple Blogs Post Likes - Add Reactions to Your Posts
 * Description: Adds like/dislike reactions to WPGraphQL for both posts and comments — WordPress has no native "reactions" concept, so this stores mutually-exclusive counters in post/comment meta.
 * Version: 1.2.1
 * Author: Bluetech Digital Ltd
 * Author URI: https://bluetech-digital.co.uk
 * Plugin URI: https://bluetech-digital.co.uk
 *
 * WordPress's plugin-header parser only reads the first line after
 * "Description:" for the wp-admin → Plugins list (it's a single-line regex,
 * not a multi-line one), which is why that line above is kept short and
 * self-contained rather than wrapped across several lines like this comment
 * block generally is — wrapping it, as an earlier version of this file did,
 * silently truncated the description shown in wp-admin mid-sentence.
 *
 * Reactions are mutually exclusive (like XOR dislike XOR neither) — both
 * mutations take the visitor's previous and new reaction so they can swap
 * atomically in one call rather than the frontend making two separate
 * requests. Posts and comments each get their own field pair, meta key
 * pair, and mutation — same shape, different target — sharing the swap/
 * validation/rate-limit logic below rather than duplicating it twice.
 *
 * INSTALL: copy this file into wp-content/mu-plugins/ (create that folder if
 * it doesn't exist — files placed there load automatically, no activation
 * step needed, and no way to accidentally deactivate them from wp-admin).
 * Requires the WPGraphQL plugin to already be active.
 *
 * This does not create a new database table, does not touch any other post
 * or comment type, and does not require authentication to read/react — both
 * mutations are intentionally public (like/dislike buttons have to work for
 * anonymous site visitors), guarded instead by a short per-target/per-IP
 * rate limit below. The Next.js frontend pairs this with its own
 * client-side "current reaction" cookie, but that alone is trivially
 * bypassed (incognito, clearing cookies) — this server-side limit is the
 * real backstop.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Validates a reaction value against the two allowed reaction strings,
 * throwing the same UserError shape both mutations rely on.
 * @param string|null $value The value to validate, or null (only ever valid for $allow_null).
 * @param bool $allow_null Whether null is an acceptable "no reaction" value (true for previousReaction, false for newReaction — which uses the string "none" for the same idea instead).
 * @param string $field_label Used only in the thrown error message.
 */
function chl_validate_reaction_value($value, $allow_null, $field_label) {
    $valid_reactions = ['like', 'dislike'];

    if ($value === null) {
        if (!$allow_null) {
            throw new \GraphQL\Error\UserError("Invalid {$field_label}.");
        }
        return;
    }

    if ($allow_null && !in_array($value, $valid_reactions, true)) {
        throw new \GraphQL\Error\UserError("Invalid {$field_label}.");
    }

    if (!$allow_null && $value !== 'none' && !in_array($value, $valid_reactions, true)) {
        throw new \GraphQL\Error\UserError("Invalid {$field_label}.");
    }
}

/**
 * Enforces a short per-target/per-IP rate limit via a WP transient, throwing
 * a UserError if the target was already reacted to within the window.
 * @param string $key_prefix Distinguishes posts from comments (and from any future target type) in the transient key, since a post and a comment can otherwise share the same numeric id.
 * @param int $target_id The post or comment databaseId being reacted to.
 * @param int $seconds How long a repeat reaction is blocked for.
 */
function chl_enforce_reaction_rate_limit($key_prefix, $target_id, $seconds = 5) {
    $ip = isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR'])) : 'unknown';
    $rate_limit_key = $key_prefix . md5($ip . '_' . $target_id);

    if (get_transient($rate_limit_key)) {
        throw new \GraphQL\Error\UserError('Please wait a moment before changing your reaction again.');
    }
    set_transient($rate_limit_key, 1, $seconds);
}

/**
 * Applies a previous → new reaction swap to a pair of like/dislike counts,
 * clamped at zero. Shared by both mutations so the increment/decrement math
 * only exists once.
 * @param int $likes
 * @param int $dislikes
 * @param string|null $previous
 * @param string $new
 * @return array{0: int, 1: int} The updated [likes, dislikes] pair.
 */
function chl_swap_reaction_counts($likes, $dislikes, $previous, $new) {
    if ($previous === 'like') {
        $likes = max(0, $likes - 1);
    } elseif ($previous === 'dislike') {
        $dislikes = max(0, $dislikes - 1);
    }

    if ($new === 'like') {
        $likes++;
    } elseif ($new === 'dislike') {
        $dislikes++;
    }

    return [$likes, $dislikes];
}

/**
 * Extracts the numeric comment ID from whatever object WPGraphQL hands a
 * `Comment` field resolver — its `Model\Comment` wrapper, not the raw
 * `WP_Comment` core object, so the native `comment_ID` (snake_case, WP core's
 * DB-column name) isn't reliably present; WPGraphQL models generally only
 * expose their own whitelisted camelCase properties (`commentId`). Confirmed
 * live: `likes`/`dislikes` always resolved to 0 even after a successful like
 * (the mutation itself was fine — it uses the raw `databaseId` sent by the
 * frontend, not this model object) — tries the likely property names in
 * order rather than assuming one, and falls back to 0 (a safe no-op —
 * `get_comment_meta(0, ...)` just returns an empty count) rather than
 * guessing wrong and fatally erroring the whole request.
 * @param mixed $comment The resolver's `$source` argument for a `Comment` field.
 * @return int The comment's numeric ID, or 0 if it couldn't be determined.
 */
function chl_get_comment_id($comment) {
    if (isset($comment->commentId)) {
        return absint($comment->commentId);
    }
    if (isset($comment->comment_ID)) {
        return absint($comment->comment_ID);
    }
    return 0;
}

add_action('graphql_register_types', function () {

    /* -------------------------------------------------------------------
    Posts
    ------------------------------------------------------------------- */

    register_graphql_field('Post', 'likes', [
        'type' => 'Int',
        'description' => 'Number of times this post has been liked (custom counter — not a native WordPress field).',
        'resolve' => function ($post) {
            $count = get_post_meta($post->ID, '_creator_hub_likes', true);
            return $count === '' ? 0 : (int) $count;
        },
    ]);

    register_graphql_field('Post', 'dislikes', [
        'type' => 'Int',
        'description' => 'Number of times this post has been disliked (custom counter — not a native WordPress field).',
        'resolve' => function ($post) {
            $count = get_post_meta($post->ID, '_creator_hub_dislikes', true);
            return $count === '' ? 0 : (int) $count;
        },
    ]);

    register_graphql_mutation('setPostReaction', [
        'inputFields' => [
            'postId' => [
                'type' => 'Int',
                'description' => "The post's databaseId (not its global GraphQL ID).",
            ],
            'previousReaction' => [
                'type' => 'String',
                'description' => 'The visitor\'s reaction before this change: "like", "dislike", or omitted/null if they had no prior reaction. Used to decrement the correct counter when swapping.',
            ],
            'newReaction' => [
                'type' => 'String',
                'description' => 'The visitor\'s new reaction: "like", "dislike", or "none" to just remove their previous reaction without setting a new one.',
            ],
        ],
        'outputFields' => [
            'likes' => [
                'type' => 'Int',
                'resolve' => function ($payload) {
                    return $payload['likes'];
                },
            ],
            'dislikes' => [
                'type' => 'Int',
                'resolve' => function ($payload) {
                    return $payload['dislikes'];
                },
            ],
        ],
        'mutateAndGetPayload' => function ($input) {
            $post_id = isset($input['postId']) ? absint($input['postId']) : 0;

            if (!$post_id || get_post_status($post_id) !== 'publish') {
                throw new \GraphQL\Error\UserError('Invalid post.');
            }

            $previous = isset($input['previousReaction']) ? sanitize_text_field($input['previousReaction']) : null;
            $new = isset($input['newReaction']) ? sanitize_text_field($input['newReaction']) : 'none';

            chl_validate_reaction_value($previous, true, 'previousReaction');
            chl_validate_reaction_value($new, false, 'newReaction');

            // Per-post, per-IP rate limit: one reaction change per post per IP
            // every 5 seconds. Short rather than the old single-like plugin's
            // 60 seconds, since swapping like<->dislike (or correcting a
            // misclick) is a legitimate, immediate action here, not spam — this
            // is defense-in-depth against rapid clicking, not a real per-visitor
            // limit (the client-side cookie already stops a normal visitor from
            // reacting more than once per post; this just stops a script from
            // hammering the mutation directly).
            chl_enforce_reaction_rate_limit('chl_reaction_', $post_id);

            $likes = (int) get_post_meta($post_id, '_creator_hub_likes', true);
            $dislikes = (int) get_post_meta($post_id, '_creator_hub_dislikes', true);

            [$likes, $dislikes] = chl_swap_reaction_counts($likes, $dislikes, $previous, $new);

            update_post_meta($post_id, '_creator_hub_likes', $likes);
            update_post_meta($post_id, '_creator_hub_dislikes', $dislikes);

            return ['likes' => $likes, 'dislikes' => $dislikes];
        },
    ]);

    /* -------------------------------------------------------------------
    Comments
    ------------------------------------------------------------------- */

    register_graphql_field('Comment', 'likes', [
        'type' => 'Int',
        'description' => 'Number of times this comment has been liked (custom counter — not a native WordPress field).',
        'resolve' => function ($comment) {
            $count = get_comment_meta(chl_get_comment_id($comment), '_creator_hub_comment_likes', true);
            return $count === '' ? 0 : (int) $count;
        },
    ]);

    register_graphql_field('Comment', 'dislikes', [
        'type' => 'Int',
        'description' => 'Number of times this comment has been disliked (custom counter — not a native WordPress field).',
        'resolve' => function ($comment) {
            $count = get_comment_meta(chl_get_comment_id($comment), '_creator_hub_comment_dislikes', true);
            return $count === '' ? 0 : (int) $count;
        },
    ]);

    register_graphql_mutation('setCommentReaction', [
        'inputFields' => [
            'commentId' => [
                'type' => 'Int',
                'description' => "The comment's databaseId (not its global GraphQL ID).",
            ],
            'previousReaction' => [
                'type' => 'String',
                'description' => 'The visitor\'s reaction before this change: "like", "dislike", or omitted/null if they had no prior reaction. Used to decrement the correct counter when swapping.',
            ],
            'newReaction' => [
                'type' => 'String',
                'description' => 'The visitor\'s new reaction: "like", "dislike", or "none" to just remove their previous reaction without setting a new one.',
            ],
        ],
        'outputFields' => [
            'likes' => [
                'type' => 'Int',
                'resolve' => function ($payload) {
                    return $payload['likes'];
                },
            ],
            'dislikes' => [
                'type' => 'Int',
                'resolve' => function ($payload) {
                    return $payload['dislikes'];
                },
            ],
        ],
        'mutateAndGetPayload' => function ($input) {
            $comment_id = isset($input['commentId']) ? absint($input['commentId']) : 0;
            $comment = $comment_id ? get_comment($comment_id) : null;

            if (!$comment || $comment->comment_approved !== '1') {
                throw new \GraphQL\Error\UserError('Invalid comment.');
            }

            $previous = isset($input['previousReaction']) ? sanitize_text_field($input['previousReaction']) : null;
            $new = isset($input['newReaction']) ? sanitize_text_field($input['newReaction']) : 'none';

            chl_validate_reaction_value($previous, true, 'previousReaction');
            chl_validate_reaction_value($new, false, 'newReaction');

            // Same 5s per-target/per-IP defense-in-depth as setPostReaction —
            // a distinct key prefix keeps a comment and a post that happen to
            // share the same numeric databaseId from colliding on one
            // transient.
            chl_enforce_reaction_rate_limit('chl_comment_reaction_', $comment_id);

            $likes = (int) get_comment_meta($comment_id, '_creator_hub_comment_likes', true);
            $dislikes = (int) get_comment_meta($comment_id, '_creator_hub_comment_dislikes', true);

            [$likes, $dislikes] = chl_swap_reaction_counts($likes, $dislikes, $previous, $new);

            update_comment_meta($comment_id, '_creator_hub_comment_likes', $likes);
            update_comment_meta($comment_id, '_creator_hub_comment_dislikes', $dislikes);

            return ['likes' => $likes, 'dislikes' => $dislikes];
        },
    ]);
});
