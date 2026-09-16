# Video-to-article transcription — setup

A weekly cron (`/api/videos/generate-articles`, see `vercel.json`) turns the
channel's newest YouTube uploads into WordPress **draft** blog posts: it
downloads each video's caption track, rewrites it into a readable article via
the Anthropic API, and creates it as a draft for the creator to review and
publish themselves — nothing here ever auto-publishes.

The code ships fully wired but does nothing until three credentials are set.
Each is independent — set them in any order, or only some of them (the cron
simply fails closed on whichever piece is missing).

---

## 1. YouTube OAuth (reads caption tracks)

`YOUTUBE_KEY`, the API key the rest of this app already uses for read-only
YouTube data, **cannot** download captions — `captions.download` is an
owner-only endpoint, regardless of whether the video's captions are public.
This needs real OAuth consent from whoever owns the channel.

1. In [Google Cloud Console](https://console.cloud.google.com/), create (or
   reuse) a project, then **APIs & Services → Library** → enable the
   **YouTube Data API v3**.
2. **APIs & Services → Credentials → Create Credentials → OAuth client ID**,
   application type **Web application**. Under **Authorized redirect URIs**,
   add exactly:
   ```
   http://localhost:8991/oauth2callback
   ```
   (Change the port only if you also set `PORT` when running the script below.)
3. Copy the generated **Client ID** and **Client Secret**.
4. Signed into the browser as the **channel owner**, run:
   ```
   YOUTUBE_OAUTH_CLIENT_ID=<client id> YOUTUBE_OAUTH_CLIENT_SECRET=<client secret> node scripts/get-youtube-refresh-token.mjs
   ```
   Open the printed consent URL, approve, and the script prints a refresh
   token in the terminal.
5. Set all three as env vars:
   ```
   YOUTUBE_OAUTH_CLIENT_ID=...
   YOUTUBE_OAUTH_CLIENT_SECRET=...
   YOUTUBE_OAUTH_REFRESH_TOKEN=...
   ```

Unlike the Instagram long-lived token this app also manages (which rotates
and needs refreshing every ~60 days), this refresh token does **not** expire
or rotate on its own — set it once. It only stops working if it's revoked
from the [Google account's connected apps](https://myaccount.google.com/permissions)
or unused for six months.

---

## 2. Anthropic API (rewrites the transcript into an article)

1. Get an API key from the [Anthropic Console](https://console.anthropic.com/).
2. Set `ANTHROPIC_API_KEY`.
3. Optional: `ANTHROPIC_MODEL` to pin a specific model; leave unset for the
   built-in default.

---

## 3. WordPress write access (creates the draft)

Every other WordPress write in this app (comments, reactions) only proves the
request *came from this Next.js server* — it doesn't authenticate as a real
WP user, which is all `createComment` needs but is not enough for
`createPost`. This feature is the first thing that writes to WordPress **as a
user**, via WordPress core's REST API and an **Application Password** (not
your login password) — no new plugin required.

1. In wp-admin, go to **Users → Profile** (for a user with at least the
   **Author** role — needs `edit_posts`, doesn't need `publish_posts` since
   articles are always created as drafts).
2. Scroll to **Application Passwords**, enter a name (e.g. `Video Article
   Generator`), click **Add New Application Password**, and copy the
   generated password immediately — it's shown once.
3. Set:
   ```
   WP_APPLICATION_USERNAME=<that user's WordPress username>
   WP_APPLICATION_PASSWORD=<the generated application password, spaces and all>
   ```

> Application Passwords require the site to be served over **HTTPS** — they're
> rejected over plain HTTP by WordPress core.

### Optional: a dedicated category

Create a **Video Articles** category under **Posts → Categories**, note its
id (visible in the edit-category URL, `tag_ID=<id>`), and set
`WP_VIDEO_ARTICLE_CATEGORY_ID`. Leave unset to create drafts uncategorised.

---

## 4. Tuning

`VIDEO_ARTICLE_MAX_PER_RUN` (default `5`) caps how many of the channel's
newest uploads are considered per cron run, bounding per-run Anthropic/YouTube
API cost. The cron only ever looks at the most recent uploads — it does not
backfill the whole channel history automatically; to process older videos,
call the route directly (see below) as many times as needed.

---

## 5. Verifying it works

Once all three credentials above are set, trigger the route manually against
a local `next dev` (or a deployed instance) rather than waiting for Monday's
cron:

```
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/videos/generate-articles
```

A `200` response with `{"ok": true, "processed": N, "created": ..., "skipped":
..., "failed": ...}` means it ran; check **Posts → All Posts → Drafts** in
wp-admin for the new article(s), each with a title Claude generated and a slug
of the form `video-article-<youtube-video-id>`.
