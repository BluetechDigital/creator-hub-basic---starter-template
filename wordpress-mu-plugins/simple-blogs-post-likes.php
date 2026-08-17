<?php
/**
 * Plugin Name: Simple Blogs Post Likes - Add Reactions to Your Posts
 * Description: Adds `likes`/`dislikes` fields and a `setPostReaction` mutation to WPGraphQL for the Next.js frontend's like/dislike buttons — WordPress has no native "reactions" concept, so this stores two simple, mutually-exclusive counters in post meta.
 * Version: 1.1.0
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
 * Reactions are mutually exclusive (like XOR dislike XOR neither) — the
 * mutation takes both the visitor's previous and new reaction so it can swap
 * atomically in one call rather than the frontend making two separate requests.
 *
 * INSTALL: copy this file into wp-content/mu-plugins/ (create that folder if
 * it doesn't exist — files placed there load automatically, no activation
 * step needed, and no way to accidentally deactivate them from wp-admin).
 * Requires the WPGraphQL plugin to already be active.
 *
 * This does not create a new database table, does not touch any other post
 * type, and does not require authentication to read/react — the mutation is
 * intentionally public (like/dislike buttons have to work for anonymous site
 * visitors), guarded instead by a short per-post/per-IP rate limit below.
 * The Next.js frontend pairs this with its own client-side "current reaction"
 * cookie, but that alone is trivially bypassed (incognito, clearing cookies) —
 * this server-side limit is the real backstop.
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('graphql_register_types', function () {

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

            $valid_reactions = ['like', 'dislike'];

            if ($previous !== null && !in_array($previous, $valid_reactions, true)) {
                throw new \GraphQL\Error\UserError('Invalid previousReaction.');
            }

            if ($new !== 'none' && !in_array($new, $valid_reactions, true)) {
                throw new \GraphQL\Error\UserError('Invalid newReaction.');
            }

            // Per-post, per-IP rate limit: one reaction change per post per IP
            // every 5 seconds. Short rather than the old single-like plugin's
            // 60 seconds, since swapping like<->dislike (or correcting a
            // misclick) is a legitimate, immediate action here, not spam — this
            // is defense-in-depth against rapid clicking, not a real per-visitor
            // limit (the client-side cookie already stops a normal visitor from
            // reacting more than once per post; this just stops a script from
            // hammering the mutation directly).
            $ip = isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR'])) : 'unknown';
            $rate_limit_key = 'chl_reaction_' . md5($ip . '_' . $post_id);

            if (get_transient($rate_limit_key)) {
                throw new \GraphQL\Error\UserError('Please wait a moment before changing your reaction again.');
            }
            set_transient($rate_limit_key, 1, 5);

            $likes = (int) get_post_meta($post_id, '_creator_hub_likes', true);
            $dislikes = (int) get_post_meta($post_id, '_creator_hub_dislikes', true);

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

            update_post_meta($post_id, '_creator_hub_likes', $likes);
            update_post_meta($post_id, '_creator_hub_dislikes', $dislikes);

            return ['likes' => $likes, 'dislikes' => $dislikes];
        },
    ]);
});
