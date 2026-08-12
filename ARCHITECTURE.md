# Architecture

Two patterns in this codebase aren't obvious from folder names alone. Everything else
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
   `DefaultTemplate_Flexiblecontent_FlexibleContent_Hero` — is handed to
   `PageContextProvider` (`context/providers/`), which puts it in React context.
3. `RenderFlexibleContent` (`components/CMS/FlexibleContent/RenderFlexibleContent.tsx`) reads
   that context, strips each block's `fieldGroupName` down to its simple name (`Hero`,
   `AboutUs`, …), and looks it up in `DynamicComponentLoaders` — a map from simple name to a
   `React.lazy()`-loaded component.
4. Each matched component is rendered with the block's CMS data as props, wrapped in
   `<Suspense>` so blocks stream in independently.

**Adding a new block type** means: create the component under `components/CMS/<Name>/`,
add its GraphQL fragment to `GetAllComponentsGraphQLFragments.ts`, and register it in
`DynamicComponentLoaders` in `RenderFlexibleContent.tsx` — the key must match the ACF field
group's simple name exactly, since that's how the runtime lookup works.

Most block components here are currently empty shells (they render a styled `<div>` and take
their props from `IProps` but don't use them yet) — the wiring is what's built, not the
per-block markup.

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
