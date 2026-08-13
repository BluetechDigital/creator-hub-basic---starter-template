# Creator Hub — Basic Starter Template

A Next.js (App Router) starter for a creator's personal hub site: CMS-driven pages backed by
WordPress/WPGraphQL, plus live feeds aggregated from the creator's social platforms
(YouTube, Instagram, Spotify, TikTok, Twitch, Discord, Facebook, Pinterest, Reddit).

See [ARCHITECTURE.md](./ARCHITECTURE.md) for how the CMS page-building system and the
social API integrations are structured.

## Requirements

- Node.js (see `package.json` for dependency versions — Next 16 / React 19)
- npm (the repo ships a `package-lock.json`)
- A WordPress instance running WPGraphQL, with ACF flexible-content fields matching the
  block names in `components/CMS/`

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template and fill in real values:

   ```bash
   cp .env.example .env.local
   ```

   See [Environment Variables](#environment-variables) below for what each value does.
   `.env.local` is git-ignored — never commit real credentials into `.env.example`.

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build (run `build` first) |
| `npm run lint` | Run ESLint |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:coverage` | Run the suite with coverage |

## Environment Variables

Everything below is documented with placeholder values in `.env.example`. Copy it to
`.env.local` and fill in the real credentials for whichever integrations you're using — every
field is optional at the framework level, but the corresponding feature will throw/skip at
request time if its variables are missing.

`NEXT_PUBLIC_`-prefixed variables are bundled into client-side JavaScript and are visible to
anyone viewing the site — never put a secret behind that prefix. Everything else is
server-only and stays out of the browser bundle.

### Site

| Variable | Public? | Purpose |
|---|---|---|
| `SITE_NAME` | server | Site name, used where the app needs to refer to itself |
| `SITE_URL` | server | Canonical site URL — used for the production HTTPS redirect in `next.config.ts` |
| `VERCEL_SCRIPT_URL` | server | Vercel scripts origin |

### CMS (WordPress / WPGraphQL)

| Variable | Public? | Purpose |
|---|---|---|
| `CMS_URL` | server | Base WordPress site URL, used in the CSP `img-src`/`connect-src` |
| `DEV_CMS_URL` | server | Development CMS URL |
| `NEXT_PUBLIC_CMS_API_URL` | **client** | WPGraphQL endpoint, read by every `graphql/CMS/` query function (all server-side `fetch()` calls with `next: { revalidate }` caching — kept `NEXT_PUBLIC_` for backwards compatibility, though nothing reads it client-side anymore) |
| `IMAGE_DIR_URL` | server | Base path for CMS-uploaded media |
| `WORDPRESS_CMS_USERNAME` / `WORDPRESS_CMS_PASSWORD` | server | CMS credentials, if the integration needs authenticated requests |
| `IMAGE_REMOTE_PATTERNS_HOSTNAME_ONE` / `_TWO` + matching `_PATHNAME_*` | server | Allow-listed hostnames/paths for `next/image` and the CSP `img-src` |

### YouTube

| Variable | Public? | Purpose |
|---|---|---|
| `YOUTUBE_API_BASE_URL` | server | YouTube Data API v3 base URL |
| `YOUTUBE_KEY` | server | YouTube Data API key — kept server-only; every caller in `api/YouTube/GetAllYoutubeContent.ts` runs server-side only |
| `YOUTUBE_CHANNEL_ID` | server | Channel to pull videos/playlists/stats from |
| `YOUTUBE_PLAYLIST_ID` | server | Optional specific playlist |
| `YOUTUBE_IMAGE_REMOTE_PATTERNS_HOSTNAME` / `_PATHNAME` | server | Thumbnail host allow-listing |
| `YOUTUBE_EMBED_REMOTE_PATTERNS_HOSTNAME` / `_PATHNAME` | server | Embed iframe host, used in the CSP `frame-src` |

### Instagram

| Variable | Public? | Purpose |
|---|---|---|
| `INSTAGRAM_ACCESS_TOKEN` | server | Long-lived Instagram Graph API token |
| `INSTAGRAM_IMAGE_REMOTE_PATTERNS_HOSTNAME` / `_PATHNAME` | server | Media host allow-listing |

### Spotify

| Variable | Public? | Purpose |
|---|---|---|
| `SPOTIFY_API_BASE_URL` | server | Spotify Web API base URL |
| `SPOTIFY_SHOW_ID` | server | Podcast show to pull episodes from |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | server | Client-credentials OAuth for the access token exchange |
| `SPOTIFY_PLAYLIST_ID` | server | Optional playlist |
| `SPOTIFY_IMAGE_REMOTE_PATTERNS_HOSTNAME` / `_PATHNAME` | server | Artwork host allow-listing |

### Twitch, TikTok, Discord, Facebook, Pinterest, Reddit

Each follows the same `<PLATFORM>_API_BASE_URL` + credential + image-remote-pattern shape —
see the corresponding section in `.env.example` and the matching file under `api/<Platform>/`.

### Misc

| Variable | Public? | Purpose |
|---|---|---|
| `NEXT_PUBLIC_GTM_ID` | **client** | Google Tag Manager container ID |
| `EMAIL_USER` / `EMAIL_PASS` / `EMAIL_HOST` | server | Nodemailer credentials for the contact form |
| `RECAPTCHA_SITE_KEY` | **client** | reCAPTCHA site key (safe to expose by design) |
| `RECAPTCHA_SECRET_KEY` | server | reCAPTCHA server-side verification secret |

## Security headers

`next.config.ts` sets HSTS, `X-Content-Type-Options`, `X-Frame-Options`, a CSP,
`Referrer-Policy`, and `Permissions-Policy` on every route, and forces HTTPS in production.
If you add a new external host (a new CDN, a new embed), update the CSP's `img-src`/
`connect-src`/`frame-src` there rather than loosening it with a wildcard.
