# WordPress mu-plugins

These files are **not part of the Next.js app** — they're PHP that needs to be installed directly on the WordPress install this site's CMS runs on. Nothing in the `npm run build`/deploy pipeline touches this folder, so deleting it (or never installing it) cannot break a Vercel build.

Install **both** files into `wp-content/mu-plugins/`. `ch-security.php` sorts first, which is deliberate — `simple-blogs-post-likes.php` reuses its helpers.

## `ch-security.php`

**Plugin Name:** Creator Hub Security — GraphQL mutation gate and comment abuse controls
**Author:** Bluetech Digital Ltd
**Version:** 1.0.0

The WPGraphQL endpoint is public and `createComment` is anonymous, so without this an attacker can POST a mutation straight to `/graphql` and skip the Next.js Server Action — meaning reCAPTCHA, input validation and Next's CSRF/Origin checks never run. This plugin:

1. **Requires an `X-Creator-Hub-Proxy-Secret` header on every GraphQL mutation** (`createComment`, `setPostReaction`, `setCommentReaction`, and any future one), matched against `CREATOR_HUB_GRAPHQL_PROXY_SECRET`. Read queries are untouched. The Next.js server adds the header from a server-only env var.
2. **Rate-limits, impersonation-screens and link-flood-screens anonymous comments** (per-IP: 1 per 30s, 5 per hour; blocks staff-role names, an impersonation of the site's own name — read live from wp-admin → Settings → General, so this works unmodified on every client site built from this template — and any registered WP user's display name; rejects >2 URLs).
3. **Pins WPGraphQL's exposure settings** from code — introspection off, GraphiQL off, batching off, query-depth limit 10.

**To install:**
1. Copy `ch-security.php` into `wp-content/mu-plugins/`.
2. In `wp-config.php`, above the "That's all, stop editing" line:
   ```php
   define( 'CREATOR_HUB_GRAPHQL_PROXY_SECRET', '<a long random string, e.g. `openssl rand -hex 32`>' );
   ```
   (or set a `CREATOR_HUB_GRAPHQL_PROXY_SECRET` environment variable on the host).
3. Set the **same value** as `CREATOR_HUB_GRAPHQL_PROXY_SECRET` in the Next.js app's environment (see `.env.example`).

**Until the secret is set** it fails *open* (mutations still work) but logs a warning to the PHP error log on every mutation. It relies on the WordPress origin being locked to the CDN so proxy IP headers can be trusted — see `docs/comment-security.md`.

## `simple-blogs-post-likes.php`

**Plugin Name:** Simple Blogs Post Likes - Add Reactions to Your Posts
**Author:** Bluetech Digital Ltd ([bluetech-digital.co.uk](https://bluetech-digital.co.uk))
**Version:** 1.2.1

Adds the reactions feature used by the single-post page's like/dislike buttons — on both the post itself and individual comments. WordPress has no native "likes"/"dislikes" concept, so this registers `likes`/`dislikes` fields on both `Post` and `Comment`, plus a `setPostReaction` and `setCommentReaction` mutation, backed by post/comment meta respectively. Reactions are mutually exclusive (like XOR dislike XOR neither) — each mutation takes the visitor's previous and new reaction so it can swap atomically in one call — see `ARCHITECTURE.md` for how the Next.js side depends on it and degrades when it's absent.

Both mutations also require the `X-Creator-Hub-Proxy-Secret` header (via `ch-security.php`) and enforce a 5s per-target/per-IP rate limit.

**To install:**
1. Connect to the WordPress site's files (hosting file manager, SFTP, etc.).
2. If `wp-content/mu-plugins/` doesn't already exist, create it.
3. Copy `simple-blogs-post-likes.php` into that folder.

That's it — files in `mu-plugins/` ("must-use") load automatically on every request, with no activation step. It'll show up under **wp-admin → Plugins → Must-Use** (a separate tab from the regular plugin list, no Activate/Deactivate/Delete buttons — remove it by deleting the file from the server). Requires the WPGraphQL plugin to already be active (it is, on this site).

**Until this is installed**, the frontend's like/dislike buttons still render but reacting will fail gracefully (the mutation simply doesn't exist yet) — it won't crash the page or the build.
