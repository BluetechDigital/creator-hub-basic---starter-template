# Video-to-article transcription

This doc is written for whoever touches this feature next — a new developer
on this project, or future-you six months from now. It explains what the
feature does, why it needed as many moving pieces as it did, every new
environment variable, how to set the whole thing up from zero, what to do
when it breaks, and what would need to change to run this for many creators
at once instead of one project's `.env` file.

If you just need the setup checklist, jump to [§3](#3-setup-walkthrough). If
you're trying to understand the code before changing it, start at §1.

---

## 1. What this feature does, and why

A weekly cron (`/api/videos/generate-articles`, scheduled in `vercel.json`)
looks at the channel's newest YouTube uploads and, for each one:

1. downloads its caption track,
2. rewrites the raw transcript into a readable article via Claude,
3. creates that article as a **WordPress draft** — never published
   automatically,
4. and, once the creator reviews and publishes it in wp-admin, the article
   renders directly on that video's own page (`/videos/[slug]`) — not a
   separate URL.

The point is SEO and discoverability: a video by itself has no crawlable text
body, so it can't rank in search for anything the creator actually says on
camera. A written article attached to the same page fixes that, and — because
it's a real WordPress post — it inherits this project's entire existing blog
pipeline for free: machine translation into every supported locale, SEO
metadata, structured data, the works.

### Why this needed three separate credentials, not one

If you're coming to this feature fresh, the number of setup steps can look
disproportionate to what it does. It's worth understanding *why*, because
it's not accidental complexity — it's three genuinely separate trust
boundaries, each with its own auth model, and none of them substitutable for
another:

| # | What it needs | Why the app's *existing* auth for that system isn't enough |
|---|----------------|---------------------------------------------------------------|
| 1 | **YouTube OAuth**, not the existing `YOUTUBE_KEY` | Every other YouTube call in this app (`api/YouTube/GetAllYoutubeContent.ts`) is public, read-only data fetched with a plain API key. Downloading a caption track (`captions.download`) is an **owner-only** endpoint — Google requires proof that whoever's asking is the channel owner, regardless of whether the captions are publicly visible on youtube.com. That proof can only come from OAuth consent, not a key. |
| 2 | **An Anthropic API key** | Nothing before this feature called an LLM at all. Rewriting a raw transcript into readable prose (not just reformatting it) needs one. |
| 3 | **A WordPress Application Password**, not the existing proxy-secret | Every other WordPress *write* in this app (`createComment`, `SetPostReaction`) only proves the request came from this Next.js server, via `config/graphqlProxySecret.ts`'s shared secret — WPGraphQL itself already allows anonymous visitors to comment/react, so that's enough. Creating a post is different: WPGraphQL only permits `createPost` for a request **authenticated as a real WordPress user** with `edit_posts` capability. The proxy secret proves *origin*, not *identity* — this is the first thing in the codebase that needed the latter. |

Three systems, three different kinds of proof-of-identity (owner OAuth
consent, an API key, a scoped application password) — that's the actual
source of the setup overhead, not any one piece being unnecessarily
complicated on its own. Each is independent of the other two: you can set
them up in any order, and the feature degrades gracefully (skips or fails
that one step, never crashes the app) if any single one is missing.

### The full request flow, file by file

```
vercel.json (weekly cron)
  → app/api/videos/generate-articles/route.ts        [entry point, CRON_SECRET-gated]
      → api/YouTube/GetAllYoutubeContent.ts           getAllYoutubeVideos() — newest uploads
      → api/WordPress/CreateVideoArticleDraft.ts       videoArticleExists() — dedup by slug
      → api/YouTube/GetVideoCaptions.ts                getVideoTranscript()
          → config/youtubeOAuth.ts                     getYoutubeAccessToken()
      → api/Anthropic/GenerateVideoArticle.ts          generateArticleFromTranscript()
      → api/WordPress/CreateVideoArticleDraft.ts       createVideoArticleDraft()
          → config/wordpressAuth.ts                    wordpressAuthHeaders()

  (creator reviews the draft in wp-admin, clicks Publish)

app/[locale]/videos/[slug]/page.tsx                    on every page view
  → graphql/CMS/GetPostContentBySlug.ts                looks up the post by its
                                                          deterministic slug
  → app/[locale]/videos/[slug]/fragments/ArticleSubHero.tsx   + ArticleContent
                                                          renders it inline, once published
```

A few decisions worth knowing about if you're extending this:

- **Dedup is a deterministic slug, not a database.** Every generated post's
  slug is forced to `video-article-<youtube-video-id>`
  (`buildVideoArticleSlug` in `api/WordPress/CreateVideoArticleDraft.ts`).
  Checking "has this video already got an article" is one lookup by that
  exact slug — no new WordPress custom field, no separate mapping table to
  keep in sync.
- **The old `/posts/video-article-*` URL is intentionally dead.**
  `app/[locale]/posts/[slug]/page.tsx` 404s any slug matching that prefix
  (`isVideoArticleSlug`), and the same check excludes these posts from the
  blog archive, "Latest posts," and the sitemap. The article's *only* public
  URL is the video's own page — this avoids the same content existing at two
  indexable addresses, which search engines treat as duplicate content.
- **A transcript has to clear a minimum-substance bar before Claude ever
  sees it.** `getVideoTranscript` (`api/YouTube/GetVideoCaptions.ts`) strips
  non-speech caption markers (`[Music]`, `(applause)`, …) and skips the video
  entirely if fewer than 40 real words are left — confirmed live, without
  this a music-only video's near-empty transcript still reached Claude, which
  correctly refused to invent details and instead wrote an article *about*
  the absence of dialogue rather than the video's actual content. Not a
  useful article; now it's skipped before spending an API call on it.
- **`generateArticleFromTranscript` never throws on bad output** — a
  malformed or missing model response returns `undefined`, and the cron
  route counts that video as `failed` and moves on to the next one
  (`app/api/videos/generate-articles/route.ts`'s per-video try/catch). One
  bad generation can't take down the whole run.

---

## 2. Environment variables

All of these are optional at the code level — the app builds and runs fine
with every one of them unset, and the feature simply does nothing (or fails
that one step and skips the video) until they're filled in. None of them are
needed for anything else in the app.

| Variable | What it's for | Where it's read |
|---|---|---|
| `YOUTUBE_OAUTH_CLIENT_ID` | Google OAuth client, for minting access tokens | `config/youtubeOAuth.ts` |
| `YOUTUBE_OAUTH_CLIENT_SECRET` | Paired with the above | `config/youtubeOAuth.ts` |
| `YOUTUBE_OAUTH_REFRESH_TOKEN` | Long-lived consent from the channel owner, minted once via `scripts/get-youtube-refresh-token.mjs` | `config/youtubeOAuth.ts` |
| `ANTHROPIC_API_KEY` | Authenticates the transcript-rewrite call | `api/Anthropic/GenerateVideoArticle.ts` |
| `ANTHROPIC_MODEL` | Optional — overrides the default model | `api/Anthropic/GenerateVideoArticle.ts` |
| `WP_APPLICATION_USERNAME` | The WordPress user the draft is created as | `config/wordpressAuth.ts` |
| `WP_APPLICATION_PASSWORD` | That user's Application Password (not their login password) | `config/wordpressAuth.ts` |
| `WP_VIDEO_ARTICLE_CATEGORY_ID` | Optional — a WP category id every generated draft is filed under | `api/WordPress/CreateVideoArticleDraft.ts` |
| `VIDEO_ARTICLE_MAX_PER_RUN` | Optional, default `5` — caps how many videos one cron run considers | `app/api/videos/generate-articles/route.ts` |
| `CMS_URL` | *Not new to this feature*, but load-bearing here: the plain WordPress origin (no `/graphql`), used to build the REST API calls. If your fork only ever had `NEXT_PUBLIC_CMS_API_URL`/`DEV_CMS_URL` set, this one is easy to have missed — see the troubleshooting entry below. | `api/WordPress/CreateVideoArticleDraft.ts` |
| `CRON_SECRET` | *Not new either* — the same bearer secret `/api/instagram/refresh-token` already requires, reused here rather than minting a second one. | `app/api/videos/generate-articles/route.ts` |

All of these live in `.env.example` with the same explanations, grouped
under their own section headers.

---

## 3. Setup walkthrough

Each of the three credentials below is independent — set them in any order,
or only some of them.

### 3.1 YouTube OAuth (reads caption tracks)

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
3. **APIs & Services → OAuth consent screen** has moved in Google's newer
   Cloud Console UI — it's now under a separate **Audience** item in the left
   sidebar (part of "Google Auth Platform"), not bundled with Credentials.
   While your app is in **Testing** publishing status (the default, and fine
   for a single project like this), only accounts explicitly listed under
   **Test users** there can complete the consent flow — add the exact Google
   account that manages the YouTube channel, even if it's the same account
   that created this Cloud project. Skipping this step is the single most
   common way this setup fails; see the troubleshooting entry below.
4. Copy the generated **Client ID** and **Client Secret**.
5. Signed into the browser as the **channel owner** (and the account you just
   added as a test user), run:
   ```
   YOUTUBE_OAUTH_CLIENT_ID=<client id> YOUTUBE_OAUTH_CLIENT_SECRET=<client secret> node scripts/get-youtube-refresh-token.mjs
   ```
   Open the printed consent URL, approve, and the script prints a refresh
   token in the terminal.
6. Set all three as env vars:
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

**One more real constraint**: `captions.download` only works for videos on a
channel the *authenticated* account actually owns or manages. Pointing
`YOUTUBE_CHANNEL_ID`/`YOUTUBE_PLAYLIST_ID` at a channel you don't have access
to will not error loudly — it'll just skip or fail every video, since there's
nothing to download captions for.

### 3.2 Anthropic API (rewrites the transcript into an article)

1. Get an API key from the [Anthropic Console](https://console.anthropic.com/).
2. Set `ANTHROPIC_API_KEY`.
3. Optional: `ANTHROPIC_MODEL` to pin a specific model; leave unset for the
   built-in default.

### 3.3 WordPress write access (creates the draft)

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

**Optional: a dedicated category.** Create a **Video Articles** category
under **Posts → Categories**, note its id (visible in the edit-category URL,
`tag_ID=<id>`), and set `WP_VIDEO_ARTICLE_CATEGORY_ID`. Leave unset to create
drafts uncategorised.

### 3.4 Tuning

`VIDEO_ARTICLE_MAX_PER_RUN` (default `5`) caps how many of the channel's
newest uploads are considered per cron run, bounding per-run Anthropic/YouTube
API cost. The cron only ever looks at the most recent uploads — it does not
backfill the whole channel history automatically; to process older videos,
call the route directly (see below) as many times as needed.

### 3.5 Verifying it works

Once all three credentials above are set, trigger the route manually against
a local `next dev` (or a deployed instance) rather than waiting for the
scheduled cron:

```
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/videos/generate-articles
```

A `200` response with `{"ok": true, "processed": N, "created": ..., "skipped":
..., "failed": ...}` means it ran; check **Posts → All Posts → Drafts** in
wp-admin for the new article(s), each with a title Claude generated and a slug
of the form `video-article-<youtube-video-id>`. Publish one, then reload that
video's page — the article should render directly beneath the video.

---

## 4. Troubleshooting

Real problems hit while building and testing this feature — in rough order
of how likely you are to hit them too.

**`Error: CMS_URL not defined.`** — `CMS_URL` (the plain WordPress origin,
no `/graphql` suffix) is a *different* variable from `NEXT_PUBLIC_CMS_API_URL`
(which has `/graphql` appended, for GraphQL reads). It's easy for `CMS_URL`
to have been left blank in an existing `.env` — the CMS-media-masking code
elsewhere in the app silently falls back to `DEV_CMS_URL` when it's unset, so
nothing surfaces the gap until this feature's REST calls need the real one.
Set it to your WordPress site's base URL.

**Google shows "Access blocked: ... has not completed the Google
verification process" (Error 403: access_denied)** — your OAuth consent
screen is in Testing mode and the account you're signing in with isn't on
its Test users list. See step 3 of §3.1 above. Being the account that
*created* the Cloud project does not automatically grant access — it has to
be added explicitly.

**"Where did the OAuth consent screen settings go?"** — Google's Cloud
Console UI moved this since older screenshots/tutorials were written: it's
now under **Google Auth Platform → Audience** in the left sidebar, not a
single "OAuth consent screen" page under Credentials.

**Cron says `created: 0, skipped: N` and nothing new appears in wp-admin** —
this is very likely correct behaviour, not a bug: either every considered
video already has an article (the deterministic-slug dedup working as
intended), or none of them have enough real spoken content in their captions
to clear the minimum-substance gate (§1's note on music-only videos). Check
the `next dev` terminal output — a genuine failure logs
`[generate-articles] Failed processing video <id>: <error>`; a clean skip
logs nothing, because it isn't an error.

**A video's caption track can't be found even though the video obviously has
captions** — confirm the OAuth-authenticated account actually manages that
specific YouTube channel in YouTube Studio (Settings → Permissions).
`captions.download` silently can't see captions on a channel the
authenticated account doesn't own/manage.

---

## 5. What running this for many creators, not one project, would need

This feature was built for a single project's `.env` file — the model this
whole codebase uses for every other credential (`YOUTUBE_KEY`,
`INSTAGRAM_ACCESS_TOKEN`, and so on). That's the right amount of engineering
for one client site. It is **not** yet the right shape for a platform where
many creators each have their own YouTube channel and WordPress site running
through the same system. Worth knowing what would actually need to change,
so it isn't underestimated later:

- **Per-creator credential storage, not process-level env vars.** Today
  every credential is one value, shared by the whole deployed instance. A
  multi-tenant version needs these stored per-creator (a database table or a
  secrets manager, not `.env`), and every function in this feature's call
  chain (`config/youtubeOAuth.ts`, `config/wordpressAuth.ts`,
  `api/Anthropic/GenerateVideoArticle.ts`) re-parameterised to take that
  creator's credentials as arguments instead of reading `process.env`
  directly at module scope.
- **A real consent UI, not a CLI script.** `scripts/get-youtube-refresh-token.mjs`
  is a one-time, developer-run tool. A creator onboarding themselves needs an
  actual "Connect your YouTube channel" button in whatever admin dashboard
  the platform has, driving the same OAuth flow through a proper redirect
  handled by the running application, not a throwaway local HTTP server.
- **Per-creator scheduling and isolation.** One shared weekly cron doesn't
  scale to many creators with different upload cadences, and a slow or
  failing creator's videos shouldn't be able to delay or crowd out another
  creator's run.
- **Cost visibility per creator.** Both the Anthropic call and (if adopted
  later) any paid speech-to-text fallback cost real money per video. A
  platform needs to know *whose* usage that cost belongs to, for billing or
  for a fair-use cap — right now it's just one undifferentiated cost line
  for whoever's `.env` it's running under.
- **Quota-aware scheduling across many channels.** YouTube's API quota is
  per Google Cloud project, not per channel — many creators authenticated
  through the same OAuth client would share one quota ceiling, which needs
  active management once there's more than a handful of channels.

None of this needs to be built now — the current feature genuinely works,
end to end, for exactly the case it was built for. It's listed here so the
jump from "works for one project" to "works for a platform" is a scoped,
understood piece of work when it's actually needed, not a surprise.
