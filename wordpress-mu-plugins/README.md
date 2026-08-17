# WordPress mu-plugins

These files are **not part of the Next.js app** — they're PHP that needs to be installed directly on the WordPress install this site's CMS runs on. Nothing in the `npm run build`/deploy pipeline touches this folder, so deleting it (or never installing it) cannot break a Vercel build.

## `simple-blogs-post-likes.php`

**Plugin Name:** Simple Blogs Post Likes - Add Reactions to Your Posts
**Author:** Bluetech Digital Ltd ([bluetech-digital.co.uk](https://bluetech-digital.co.uk))
**Version:** 1.2.0

Adds the reactions feature used by the single-post page's like/dislike buttons — on both the post itself and individual comments. WordPress has no native "likes"/"dislikes" concept, so this registers `likes`/`dislikes` fields on both `Post` and `Comment`, plus a `setPostReaction` and `setCommentReaction` mutation, backed by post/comment meta respectively. Reactions are mutually exclusive (like XOR dislike XOR neither) — each mutation takes the visitor's previous and new reaction so it can swap atomically in one call — see `ARCHITECTURE.md` for how the Next.js side depends on it and degrades when it's absent.

**To install:**
1. Connect to the WordPress site's files (hosting file manager, SFTP, etc.).
2. If `wp-content/mu-plugins/` doesn't already exist, create it.
3. Copy `simple-blogs-post-likes.php` into that folder.

That's it — files in `mu-plugins/` ("must-use") load automatically on every request, with no activation step. It'll show up under **wp-admin → Plugins → Must-Use** (a separate tab from the regular plugin list, no Activate/Deactivate/Delete buttons — remove it by deleting the file from the server). Requires the WPGraphQL plugin to already be active (it is, on this site).

**Until this is installed**, the frontend's like/dislike buttons still render but reacting will fail gracefully (the mutation simply doesn't exist yet) — it won't crash the page or the build.
