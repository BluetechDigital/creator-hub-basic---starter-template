# WordPress mu-plugins

These files are **not part of the Next.js app** — they're PHP that needs to be installed directly on the WordPress install this site's CMS runs on. Nothing in the `npm run build`/deploy pipeline touches this folder.

## `creator-hub-likes.php`

Adds the post-likes feature used by the single-post page's like button. WordPress has no native "likes" concept, so this registers a small custom field + mutation in WPGraphQL, backed by post meta.

**To install:**
1. Connect to the WordPress site's files (hosting file manager, SFTP, etc.).
2. If `wp-content/mu-plugins/` doesn't already exist, create it.
3. Copy `creator-hub-likes.php` into that folder.

That's it — files in `mu-plugins/` ("must-use") load automatically on every request, with no activation step and no way to accidentally deactivate them from the wp-admin Plugins screen. Requires the WPGraphQL plugin to already be active (it is, on this site).

**Until this is installed**, the frontend's like button still renders but the like action will fail gracefully (the mutation simply doesn't exist yet) — it won't crash the page.
