# Architecture

Four things in this codebase aren't obvious from folder names alone. Everything else
(app routes, global providers, animation components) follows standard Next.js App Router
conventions and doesn't need its own section here.

## 1. CMS flexible-content blocks

Pages are not hand-built. A CMS editor composes a WordPress page out of ACF ("Advanced
Custom Fields") flexible-content blocks — Hero, AboutUs, CallToAction, etc. — in whatever
order they like, and `app/[locale]/[slug]/page.tsx` renders whichever blocks that page actually has,
in that order, with no per-page React code.

**The pipeline, slug → rendered blocks:**

1. `app/[locale]/[slug]/page.tsx` calls `getAllPageACFFlexibleComponentsContent` (`graphql/CMS/`),
   which runs a **two-pass GraphQL query** against WPGraphQL:
   - **Pass 1** (`GetAllACFFlexibleComponentsList.ts`) asks only for the `fieldGroupName` of
     each block on the page — a cheap query used to work out *which* blocks are present.
   - **Pass 2** (`GetAllPageACFFlexibleComponentsContent.ts`) re-queries, this time
     requesting the full GraphQL fragment (`GetAllComponentsGraphQLFragments.ts`) only for
     the block types Pass 1 found. This avoids requesting every possible block's fragment on
     every page load.
2. The result — an array of blocks, each carrying a WordPress `fieldGroupName` like
   `DefaultTemplate_Flexiblecontent_FlexibleContent_Hero` — is passed directly as a prop to
   `RenderFlexibleContent` (`components/CMS/FlexibleContent/RenderFlexibleContent.tsx`).
3. `RenderFlexibleContent` strips each block's `fieldGroupName` down to its simple name
   (`Hero`, `AboutUs`, …) and looks it up in `DynamicComponentLoaders` — a map from simple
   name to a plain `import()` loader, awaited server-side (not `React.lazy()`) by a small
   per-block `ResolvedBlock` Server Component. This matters because several blocks
   (`AllYoutubeVideos`, `AllYoutubeShortsVideos`, `AllBlogPosts`) are themselves `async`
   Server Components that fetch their own data — React does not support rendering an async
   component via `React.lazy()`/`createElement` from a Client Component, so resolution has to
   happen server-side. `RenderFlexibleContent` itself carries no `'use client'` directive for
   this reason.
4. Each matched component is rendered with the block's CMS data as props, wrapped in its own
   `<Suspense>` boundary so blocks stream in independently.

**Adding a new block type** means: create the component under `components/CMS/<Name>/`,
add its GraphQL fragment to `GetAllComponentsGraphQLFragments.ts`, and register it in
`DynamicComponentLoaders` in `RenderFlexibleContent.tsx` — the key must match the ACF field
group's simple name exactly, since that's how the runtime lookup works.

**`components/CMS/` is for reusable blocks, not client-specific ones.** Every folder here
ships to every client this template is forked for. If a request only makes sense for one
client (a one-off section, a bespoke layout variant, anything that wouldn't be reused), it
does not belong in this tree — the "no bespoke features" line in the Basic-tier package is a
business rule, and nothing in the registration mechanism itself stops a bespoke block from
being added and wired up exactly like a real one, so this has to be enforced by not doing it,
not by tooling. If a client's build genuinely needs one-off components (an Individual-tier
build, for example), keep them in that client's own fork rather than merging them back into
the shared starter — see [`blockRegistration.test.ts`](./components/CMS/FlexibleContent/blockRegistration.test.ts)
for what *is* automatically checked here (a block folder and its `DynamicComponentLoaders`
entry staying in sync) and what isn't (whether a block should exist in the shared tree at
all — that's a review-time judgment call, not something a test can make for you).

Most block components here are currently empty shells (they render a styled `<div>` and take
their props from `IProps` but don't use them yet) — the wiring is what's built, not the
per-block markup. [`blockSmokeTests.test.tsx`](./components/CMS/FlexibleContent/blockSmokeTests.test.tsx)
covers all of them with a render-without-crashing + root-class assertion for now; as a block
gets real markup, give it its own test file with real prop-behaviour assertions (see
[`TitleParagraph.test.tsx`](./components/CMS/TitleParagraph/TitleParagraph.test.tsx) for the
pattern — it's the one block with actual conditional logic today) rather than leaving it in
the generic smoke-test list.

## 2. One folder per social platform

`api/<Platform>/GetAll<Platform>Content.ts` — one file per integration (Discord, Facebook,
Instagram, Pinterest, Reddit, Spotify, TikTok, Twitch, YouTube). Each file is self-contained
and follows the same shape:

- Reads its own credentials from `process.env` at module scope (see the README's
  [Environment Variables](./README.md#environment-variables) table for the full list).
- Exports typed `getAllXContent()` functions that `fetch()` the platform's public API and
  return a typed result — the raw API response shape and the trimmed-down shape this app
  actually uses are kept as separate types (e.g. `IRawEpisodesResponse` vs.
  `ISpotifyEpisodes` in the Spotify file) so callers don't depend on upstream API fields we
  don't use.
- Uses Next's `fetch(..., { next: { revalidate: <seconds> } })` for time-based caching
  instead of on-demand revalidation, since these are third-party feeds with no webhook to
  invalidate on.
- These functions are called **from inside** an async server component's function body (not
  at module scope) — e.g. `AllYoutubeVideos.tsx` fetches in its own component function, so
  Next's per-request fetch caching/revalidation applies the way it does for any other server
  component data fetch.

Every integration is independent — there's no shared "social provider" abstraction, by
design, since each platform's auth flow and response shape differs enough that a shared
interface would mostly be indirection. If you add a new platform, copy the shape of the
closest existing one (Twitch and TikTok are the simplest examples) rather than inventing a
new pattern.

## 3. WordPress-side dependency: `wordpress-mu-plugins/`

Everything else in this repo talks to WordPress purely through WPGraphQL's existing schema —
no custom WordPress code required. **One feature is the exception**: the single-post page's
like/dislike buttons, on both posts (`app/[locale]/posts/[slug]/fragments/EngagementBar.tsx`) and
individual comments (`app/[locale]/posts/[slug]/fragments/CommentReactions.tsx`).

WordPress has no native "likes"/"dislikes" concept, so
[`wordpress-mu-plugins/simple-blogs-post-likes.php`](./wordpress-mu-plugins/simple-blogs-post-likes.php)
is a small companion PHP file — **not part of the Next.js app or its build** — that registers
`likes`/`dislikes` fields and a `setPostReaction`/`setCommentReaction` mutation pair in WPGraphQL,
one targeting posts (backed by post meta) and one targeting comments (backed by comment meta),
sharing their swap/validation/rate-limit logic rather than duplicating it. Reactions are mutually
exclusive (like XOR dislike XOR neither) on both; each mutation takes the visitor's previous and
new reaction so it can swap atomically in one call instead of the frontend issuing two separate
increment/decrement requests. It has to be installed directly on the WordPress site
(`wp-content/mu-plugins/`, see [`wordpress-mu-plugins/README.md`](./wordpress-mu-plugins/README.md)
for the install steps) — nothing in this repo's toolchain can deploy PHP to a separate WordPress
host, so this is a manual step for whoever manages that WordPress install, the same way the
underlying WP/ACF/WPGraphQL setup itself is.

**If it's missing, deleted, or not yet installed** (e.g. a fresh fork, before anyone's set this
up): nothing breaks. Querying a GraphQL field/mutation that doesn't exist fails validation for
that request only — `graphql/CMS/GetPostReactions.ts`/`SetPostReaction.ts` and
`graphql/CMS/GetCommentReactions.ts`/`SetCommentReaction.ts` are all deliberately isolated from
their respective main content queries for exactly this reason (folding `likes`/`dislikes` into
`GetPostContentBySlug.ts`'s or `GetPostComments.ts`'s query would take the *entire* post page or
comments section down, not just reactions, the moment the fields don't exist — confirmed live
against a real WPGraphQL endpoint before this was built this way). All four catch that failure
and resolve to `undefined` rather than throwing; the frontend shows like/dislike counts of `0`
and a button click silently no-ops instead of persisting. This folder existing (or not) can never
affect a Vercel build.

**Comment/reaction security** — comments are anonymous and auto-approved, so the write
path is hardened at several layers: every WPGraphQL *mutation* requires an
`X-Creator-Hub-Proxy-Secret` header (`wordpress-mu-plugins/ch-security.php` +
`config/graphqlProxySecret.ts`), so only this server can call one; the `submitComment`
Server Action adds a honeypot, link cap, per-IP rate limit and reCAPTCHA v3 score check;
comment HTML is sanitized server-side (`graphql/CMS/sanitizeCommentHtml.ts`) before it
enters the RSC payload. Full threat model, rollout and the infra checklist:
[`docs/comment-security.md`](./docs/comment-security.md).

## 4. Hiding the CMS origin

Nothing a visitor's browser loads should ever reveal the real WordPress hostname — not an
`<img src>`, not a "copy link address" on a document, not page source. A headless-CMS setup
that redirects a human visitor away from the CMS domain (e.g. a `wp-login`/homepage redirect
plugin) doesn't achieve this on its own: that only handles someone navigating *to* the CMS
directly. It does nothing about the CMS's own hostname appearing in URLs *this app itself
renders* — a featured image, a PDF a CMS editor linked from the media library, an SEO share
image — since WPGraphQL returns those as absolute URLs pointing at the real CMS origin, and
by default that's exactly what ends up in the rendered HTML.

**The fix is two pieces, both required — either alone does nothing:**

1. **`app/api/media/[...path]/route.ts`** — a Route Handler that proxies a WordPress media
   file (`wp-content/uploads/...` only — never `wp-admin`, `wp-login.php`, or the CMS's own
   `wp-json` REST API, so this can't become a general-purpose reverse proxy onto the CMS)
   through this app's own domain: it fetches the real file server-side using `CMS_URL` and
   streams it back, so a proxied URL (`/api/media/wp-content/uploads/...`) is a genuine
   same-origin path a visitor's browser can load.
2. **`config/cmsMediaUrl.ts`** — rewrites every CMS-origin URL to that proxy path, at the
   point each `graphql/CMS/*.ts` query unwraps its response (a featured image's `sourceUrl`,
   an SEO `opengraphImage`/`twitterImage`, the error page's `backgroundImage`) or a flexible-
   content block's WYSIWYG prose field is resolved (`RenderFlexibleContent.tsx`'s
   `rewriteBlockMediaUrls`, alongside its existing i18n translation pass). `rewriteCmsUrlsInHtml`
   specifically handles WYSIWYG HTML strings (`content`/`excerpt`, a block's `paragraph`
   field) — it rewrites both `<img src>` *and* `<a href>` in one pass, so a document link a CMS
   editor pasted directly (not through a dedicated ACF file field) is covered too, not just images.

Rewriting happens **once, upstream, at the data layer** — never at the component that finally
renders a URL. That means no render path can forget to call this by omission: `ArticleContent.tsx`
(which parses WYSIWYG HTML element-by-element via `html-react-parser`) and `Paragraph.tsx`
(which injects it directly via `dangerouslySetInnerHTML`) both just render whatever HTML string
they're handed — by the time either one sees it, it's already safe, because the string itself
was already rewritten before either component ever received it as a prop.

**Jetpack Photon (Site Accelerator).** If it's active on the CMS — this project's own
`IMAGE_REMOTE_PATTERNS_HOSTNAME_ONE=i0.wp.com` and `ArticleContent.test.tsx`'s own fixture
content both already assumed it is — WPGraphQL hands back image URLs shaped like
`https://i0.wp.com/<cms-hostname>/wp-content/uploads/...`, not `${CMS_URL}/wp-content/uploads/...`
directly: Photon wraps the *original* URL into its own path instead of proxying through the
CMS's own domain. A plain `startsWith(CMS_URL)` check never matches that, so the CMS's real
hostname was leaking straight through, embedded in the Photon path — the same class of gap
the sibling CBF-Rebuild project independently found first, in its homepage FAQ block.
`config/cmsMediaUrl.ts`'s `resolvePhotonUrl` recognizes and unwraps this before the normal
CMS-origin check runs, matched by **hostname alone** (not the full origin string, the way a
direct URL is) — Photon discards the original scheme and port entirely when it wraps a URL,
so an origin-string match could never work here even in production, let alone against this
project's own local `http://localhost:<port>` dev/E2E CMS.

**What this does not cover, on purpose:** `opengraphImage`/`twitterImage` are rewritten for
consistency and future-proofing, but neither is actually rendered into a `<meta>` tag anywhere
in this codebase yet — `rewriteCmsMediaUrl` returns a root-relative path, correct for an
`<img>`/`next/image` `src`, but the Open Graph/Twitter Card spec needs an *absolute* URL for
external crawlers (Facebook, Twitter, LinkedIn) to fetch a share-card image at all. Whoever
wires `openGraph.images` up later must prefix the rewritten path with `SITE_URL` first — see
the comment in `GetAllSeoContent.ts`. YouTube/Instagram/Gravatar URLs are untouched entirely —
`rewriteCmsMediaUrl`/`rewriteCmsUrlsInHtml` only ever match a URL that actually starts with
`CMS_URL`/`DEV_CMS_URL`; a different host is a different concern from what this section covers.

## Testing

Two layers: Vitest + React Testing Library for units/components, Playwright for end-to-end.

### Unit / component (Vitest)

`npm test` / `npm run test:watch` / `npm run test:coverage`. Config: `vitest.config.mts`,
`vitest.setup.ts`. `vitest.config.mts` excludes `e2e/**` — the two runners' glob patterns
(`*.test.{ts,tsx}` vs `*.spec.ts`) never collide, but the exclusion is explicit anyway.

- **API layer** (`api/<Platform>/*.test.ts`): `global.fetch` is mocked with `vi.stubGlobal`.
  Because each platform file reads its env vars into module-scope consts on import rather than
  per-call, tests that need different env values have to `vi.resetModules()` and dynamically
  `import()` a fresh copy of the module — see the comment at the top of
  `GetAllYoutubeContent.test.ts` if you're adding a test for one of the other seven platforms.
- **CMS blocks** (`components/CMS/**/*.test.tsx`): rendered with React Testing Library.
  `AllYoutubeVideos`/`AllYoutubeShortsVideos` are excluded from render tests — they're async
  Server Components, and RTL's `render()` doesn't support awaiting one; their data-fetching is
  covered via the API-layer tests instead. Any component that renders `framer-motion`'s
  `motion.*` elements needs `vitest.setup.ts`'s `ResizeObserver`/`IntersectionObserver`/
  `matchMedia` stubs (jsdom implements none of them) — already wired up globally, nothing to
  add per test.
- **Block registration** (`blockRegistration.test.ts`): catches drift between
  `components/CMS/` folders and `DynamicComponentLoaders` — the exact shape of bug this repo
  shipped with (`YoutubeVideoGrid` vs `YouTubeVideoGrid` casing). Doesn't gate what's allowed
  to be registered — see the note in [§1](#1-cms-flexible-content-blocks) above.

### End-to-end (Playwright)

`npm run e2e` / `npm run e2e:ui` (installs its own browser: `npx playwright install --with-deps
chromium`). Config: `playwright.config.ts`, specs in `e2e/*.spec.ts`, shared setup in
`e2e/support/fixtures.ts`. Covers `proxy.ts` locale routing + the `LocaleSwitcher`, the CMS
flexible-content pipeline end to end (slug → GraphQL → rendered blocks), comment submission,
the contact form, and a lean route/SEO smoke suite (`robots.txt`/`sitemap.xml`).

**Why `next dev`, not a production build.** The Vitest suite above tests units in isolation;
this suite needs a real running app. `playwright.config.ts`'s `webServer` array runs `next dev`
(not `next start`) for two reasons: `next dev` sets `NODE_ENV=development`, which makes
`config/recaptcha.ts` *skip* verification when the reCAPTCHA secret is unset — `next start`
fails **closed** in that state (by design, so a misconfigured production deploy doesn't silently
accept unverified submissions), which would block every comment/contact-form test. Dev is also
where this project's actual runtime bugs have surfaced (a missing `'use client'`, a null-content
crash — see `RenderFlexibleContent.tsx`'s `content ?? []` guard), and its dev-only React/Next
error overlay gives specs a strong "the route didn't crash" signal via the browser's `pageerror`
event. Production-compile correctness is still covered separately, by the `quality` CI job's own
`npm run build` step (see below).

**No real WordPress, no real credentials.** `graphql/CMS/*.ts`/reCAPTCHA/Azure
Translator/Nodemailer all call out over plain `fetch`/SMTP, so `webServer` also starts
`e2e/fixtures/server.mjs` — one Node process serving a fake WPGraphQL + YouTube Data API +
Azure Translator endpoint (`e2e/fixtures/router.mjs`/`data.mjs` hold the canned responses) plus
a fake SMTP server (the `smtp-server` package) the contact form's Nodemailer transporter
connects to. `e2e/fixtures/env.mjs` points the app at all of it and — importantly — explicitly
blanks (`""`, not omitted) reCAPTCHA, `CREATOR_HUB_GRAPHQL_PROXY_SECRET`, and
`NEXT_PUBLIC_GTM_ID`: leaving a key out of that object doesn't mean "unset" the way it sounds —
`next dev`'s own `.env`/`.env.local` loading fills in any key not already present in
`process.env`, so an unset var here silently inherited this project's real, git-ignored `.env`
values (confirmed live: the real reCAPTCHA site key leaking in made every form submission hang
trying to load Google's actual widget).

**Two caveats specific to this approach, both confirmed live:**

- `playwright.config.ts`'s `next dev` command wipes the entire `.next` directory before
  starting, not just `.next/cache` — every `graphql/CMS/*.ts` fetch uses
  `next: { revalidate: 86400 }`, and Next's on-disk Data Cache/build artifacts survive a
  `next dev` restart. A leftover `next build` output sitting alongside `next dev`'s own
  `.next/dev` (from `quality`'s own build step running locally, or a stray `npm run build`) made
  `next dev` serve build-time prerendered HTML instead of ever calling the fake backend — pages
  rendered with real-looking content while the fixture server's request log stayed empty.
- That same 24-hour revalidate means a query's *first* successful request in a given `next dev`
  process's lifetime is cached for the rest of that run — including Playwright's own webServer
  readiness probe (`GET /en`), which fires before any spec runs. A fixture-side "make this next
  request fail" scenario switch has no way to reach a request that's already served from cache.
  This is why the suite doesn't attempt to exercise the Home-page null-content regression (see
  `RenderFlexibleContent.test.tsx`'s unit tests for that one, and `e2e/fixtures/server.mjs`'s own
  doc comment) live through the browser — a fresh, never-before-requested slug (`broken-page`)
  isn't affected and works exactly as expected.

**Rate-limit isolation.** `config/rateLimit.ts` is a per-process in-memory `Map` keyed by IP
(`"comment:"+ip` / `"contact:"+ip`), shared across every spec against the same `next dev`
process. `e2e/support/fixtures.ts`'s `ip` fixture hands each test a unique `x-forwarded-for`
value so one spec's submissions never trip another's bucket — except the two rate-limit specs
themselves, which deliberately reuse one IP for 4 rapid submissions.
