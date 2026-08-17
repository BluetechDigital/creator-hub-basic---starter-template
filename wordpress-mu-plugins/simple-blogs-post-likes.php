<?php
/**
 * Plugin Name: Simple Blogs Post Likes - Add Reactions to Your Posts
 * Description: Adds a `likes` field and an `incrementPostLikes` mutation to
 * WPGraphQL for the Next.js frontend's like button. WordPress has no native
 * "likes" concept, so this stores a simple integer counter in post meta.
 * Version: 1.0.0
 * Author: BluetechDigital Ltd
 * Author URI: https://bluetech-digital.co.uk
 * Plugin URI: https://bluetech-digital.co.uk
 *
 * INSTALL: copy this file into wp-content/mu-plugins/ (create that folder if
 * it doesn't exist — files placed there load automatically, no activation
 * step needed, and no way to accidentally deactivate them from wp-admin).
 * Requires the WPGraphQL plugin to already be active.
 *
 * This does not create a new database table, does not touch any other post
 * type, and does not require authentication to read/increment — the mutation
 * is intentionally public (a "like" button has to work for anonymous site
 * visitors), guarded instead by a short per-post/per-IP rate limit below.
 * The Next.js frontend pairs this with its own client-side "already liked"
 * cookie, but that alone is trivially bypassed (incognito, clearing
 * cookies) — this server-side limit is the real backstop.
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

    register_graphql_mutation('incrementPostLikes', [
        'inputFields' => [
            'postId' => [
                'type' => 'Int',
                'description' => "The post's databaseId (not its global GraphQL ID).",
            ],
        ],
        'outputFields' => [
            'likes' => [
                'type' => 'Int',
                'description' => 'The new like count after incrementing.',
                'resolve' => function ($payload) {
                    return $payload['likes'];
                },
            ],
        ],
        'mutateAndGetPayload' => function ($input) {
            $post_id = isset($input['postId']) ? absint($input['postId']) : 0;

            if (!$post_id || get_post_status($post_id) !== 'publish') {
                throw new \GraphQL\Error\UserError('Invalid post.');
            }

            // Per-post, per-IP rate limit: one increment per post per IP per
            // 60 seconds. Defense-in-depth against the trivially-bypassable
            // client-side cookie guard, not a substitute for it — this alone
            // doesn't stop a determined abuser rotating IPs, just casual
            // double-clicking/refreshing.
            $ip = isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR'])) : 'unknown';
            $rate_limit_key = 'chl_like_' . md5($ip . '_' . $post_id);

            if (get_transient($rate_limit_key)) {
                throw new \GraphQL\Error\UserError('Please wait a moment before liking again.');
            }
            set_transient($rate_limit_key, 1, 60);

            $current = get_post_meta($post_id, '_creator_hub_likes', true);
            $current = $current === '' ? 0 : (int) $current;
            $new_count = $current + 1;

            update_post_meta($post_id, '_creator_hub_likes', $new_count);

            return ['likes' => $new_count];
        },
    ]);
});
