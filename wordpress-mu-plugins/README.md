# WordPress mu-plugins

These files are **not part of the Next.js app** — they're PHP that needs to be installed directly on the WordPress install this site's CMS runs on. Nothing in the `npm run build`/deploy pipeline touches this folder, so deleting it (or never installing it) cannot break a Vercel build.

## `simple-blogs-post-likes.php`

**Plugin Name:** Simple Blogs Post Likes - Add Reactions to Your Posts
**Author:** BluetechDigital Ltd ([bluetech-digital.co.uk](https://bluetech-digital.co.uk))
**Version:** 1.0.0

Adds the post-likes feature used by the single-post page's like button. WordPress has no native "likes" concept, so this registers a small custom `likes` field and `incrementPostLikes` mutation in WPGraphQL, backed by post meta — see `ARCHITECTURE.md` for how the Next.js side depends on it and degrades when it's absent.

**To install:**
1. Connect to the WordPress site's files (hosting file manager, SFTP, etc.).
2. If `wp-content/mu-plugins/` doesn't already exist, create it.
3. Copy `simple-blogs-post-likes.php` into that folder.

That's it — files in `mu-plugins/` ("must-use") load automatically on every request, with no activation step. It'll show up under **wp-admin → Plugins → Must-Use** (a separate tab from the regular plugin list, no Activate/Deactivate/Delete buttons — remove it by deleting the file from the server). Requires the WPGraphQL plugin to already be active (it is, on this site).

**Until this is installed**, the frontend's like button still renders but the like action will fail gracefully (the mutation simply doesn't exist yet) — it won't crash the page or the build.
