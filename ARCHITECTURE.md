# Architecture

Three things in this codebase aren't obvious from folder names alone. Everything else
(app routes, global providers, animation components) follows standard Next.js App Router
conventions and doesn't need its own section here.

## 1. CMS flexible-content blocks

Pages are not hand-built. A CMS editor composes a WordPress page out of ACF ("Advanced
Custom Fields") flexible-content blocks — Hero, AboutUs, CallToAction, etc. — in whatever
order they like, and `app/[slug]/page.tsx` renders whichever blocks that page actually has,
in that order, with no per-page React code.

**The pipeline, slug → rendered blocks:**

1. `app/[slug]/page.tsx` calls `getAllPageACFFlexibleComponentsContent` (`graphql/CMS/`),
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
like/dislike buttons, on both posts (`app/posts/[slug]/fragments/EngagementBar.tsx`) and
individual comments (`app/posts/[slug]/fragments/CommentReactions.tsx`).

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

## Testing

Vitest + React Testing Library (`npm test` / `npm run test:watch` / `npm run test:coverage`).
Config: `vitest.config.mts`, `vitest.setup.ts`. There's no E2E/Playwright layer yet — this is
component- and unit-level only.

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
