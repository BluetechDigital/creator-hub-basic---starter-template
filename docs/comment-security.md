# Comment & engagement security

The single-post page lets **anonymous visitors** submit comments and like/dislike
posts and comments. Comments are **auto-approved** (no moderation queue). This
document is the threat model, what's implemented in code, how to roll it out, and
the infrastructure checklist that has to be done outside this repo.

This starter template gets forked per client/creator. None of these sites are
assumed to hold personal or financial data, but a defaced or spam-filled comment
section is a reputational incident on anyone's domain — the controls below don't
assume a low-stakes site.

---

## 1. Threat model

| # | Vector | Severity | Status |
|---|--------|----------|--------|
| 1 | **Direct hit on the public `/graphql` endpoint** — `createComment` / `setPostReaction` / `setCommentReaction` are anonymous WPGraphQL mutations. A raw POST skips the Next.js Server Action, so reCAPTCHA, validation, honeypot, rate limiting and Next's CSRF/Origin checks never run. | High | **Closed** — every mutation now requires the `X-Creator-Hub-Proxy-Secret` header (`ch-security.php`). Only this server can call one. |
| 2 | **Stored XSS via comment HTML** rendered with `dangerouslySetInnerHTML`. | High | **Mitigated** — triple sanitized: WordPress `kses` → server-side `sanitizeCommentHtml` (tiny allowlist, `<a>`/`<img>`/`<iframe>`/`<script>`/`<style>` all removed) → client `DOMPurify`. CSP `script-src` still carries `'unsafe-inline'` (see §5). |
| 3 | **Spam / phishing / defamation** auto-published on the domain. | Med–High | **Mitigated, not eliminated** — honeypot + reCAPTCHA v3 score + per-IP rate limits (Next + mu-plugin) + link-flood block + impersonation block. Residual risk is inherent to auto-approve (see §5). |
| 4 | **Impersonation** — `author` / `authorEmail` are attacker-controlled in `createComment`. | Med | **Closed** — `ch-security.php` rejects staff-role names, the site's own name (read live from wp-admin, so this holds on every fork without editing PHP), and any registered WP user's display name. |
| 5 | **Reaction-count manipulation** — unauthenticated writes to post/comment meta. | Low | **Mitigated** — proxy-secret gate + 5s per-target/per-IP limit + 20/min per-IP Next pre-filter. Vanity metric; not worth more. |
| 6 | **Comment/reaction flooding (DoS-by-volume / DB bloat).** | Med | **Mitigated** — mu-plugin: 1 comment / 30s and 5 / hour per IP. Next pre-filter: 3 comments/min, 20 reactions/min per IP. Needs the edge WAF rule in §4 for the real ceiling. |
| 7 | **reCAPTCHA fails open** when the secret is unset. | Low | **Closed** — `verifyRecaptcha` fails *closed* in production. |
| 8 | Unused `WORDPRESS_CMS_USERNAME` / `_PASSWORD` in `.env.example`. | Low | **Closed** — removed. |

---

## 2. What's implemented (this repo)

### WordPress — `wordpress-mu-plugins/`

- **`ch-security.php`** (new)
  - `graphql_before_execute` gate: any mutation without a valid `X-Creator-Hub-Proxy-Secret`
    header is rejected with `This operation is not allowed.` Reads are untouched.
  - `preprocess_comment` (anonymous GraphQL only): per-IP rate limit (1/30s,
    5/hour), staff/registered-user name impersonation block, `>2` URL block.
  - `ch_client_ip()` — prefers `CF-Connecting-IP` / `True-Client-IP` /
    `X-Real-IP` / first `X-Forwarded-For` hop over `REMOTE_ADDR`.
  - Pins WPGraphQL settings from code: introspection off, GraphiQL off, batch
    queries off, query-depth limit 10, tracing/query-logs off.
- **`simple-blogs-post-likes.php`** — both reaction mutations now call
  `chl_require_trusted_proxy()` and key their rate limit on `ch_client_ip()`.

### Next.js

| File | Change |
|------|--------|
| `config/graphqlProxySecret.ts` | server-only; `graphqlMutationHeaders()` → the `X-Creator-Hub-Proxy-Secret` header, spread into every mutation `fetch`. |
| `graphql/CMS/CreateComment.ts`, `SetPostReaction.ts`, `SetCommentReaction.ts` | send the header. |
| `graphql/CMS/sanitizeCommentHtml.ts` | server-side allowlist sanitize; applied in `GetPostComments.ts` before content enters the RSC payload. |
| `config/rateLimit.ts` | per-process sliding-window pre-filter + `getRequestIp()`. |
| `app/[locale]/posts/[slug]/actions.ts` | honeypot drop, link-count cap, rate limits (3 comments/min, 20 reactions/min per IP), reCAPTCHA action `"comment"`. |
| `components/CMS/ContactForm/actions.tsx` | rate limit (3/min per IP), reCAPTCHA action `"contact"`. |
| `config/recaptcha.ts` | **reCAPTCHA v3** — score + action check, `GOOGLE_V3_RECAPTCHA_MIN_SCORE` (default 0.5), **fails closed in production**. |
| `hooks/useRecaptchaV3.ts` + `CommentForm.tsx` + `ContactForm.tsx` | invisible v3 token on submit (no widget); badge hidden site-wide in `globals.css` with the required attribution text on both forms. |
| `next.config.ts` CSP | `'unsafe-eval'` is now **dev-only**; added `base-uri 'none'`, `form-action 'self'`; added reCAPTCHA hosts to `script-src` / `connect-src` / `frame-src`. |

> The Next `config/rateLimit.ts` limiter is per-instance and resets on cold start
> — it's a **pre-filter**, not the authority. The authoritative per-visitor limit
> is the mu-plugin's (WP transients = shared state), which every mutation passes
> through. For a cross-instance guarantee, back `checkRateLimit` with Upstash /
> Vercel KV — the call sites don't change.

---

## 3. Rollout (order matters)

A mismatch between the two secrets breaks comments/reactions. Deploy in this
order:

1. **Generate the secret:** `openssl rand -hex 32`.
2. **Next.js env:** set `CREATOR_HUB_GRAPHQL_PROXY_SECRET` in the hosting platform, and
   optionally `GOOGLE_V3_RECAPTCHA_MIN_SCORE`. Deploy. (The mu-plugin still fails open at
   this point, so nothing breaks.)
3. **Create a reCAPTCHA v3 key pair** at <https://www.google.com/recaptcha/admin>
   (v2 keys will not work), set `NEXT_PUBLIC_GOOGLE_V3_RECAPTCHA_SITE_KEY` /
   `GOOGLE_V3_RECAPTCHA_SECRET_KEY`, redeploy.
4. **WordPress:** copy `ch-security.php` + `simple-blogs-post-likes.php` into
   `wp-content/mu-plugins/`, then add to `wp-config.php` (above "That's all, stop
   editing"):
   ```php
   define( 'CREATOR_HUB_GRAPHQL_PROXY_SECRET', '<the same value from step 1>' );
   ```
5. **Verify:** post a test comment through the site (should work); `curl` a
   `createComment` mutation straight at `/graphql` without the header (should be
   rejected).
6. **Rotate** by repeating 1 → set both sides → the old value stops working the
   moment the wp-config constant changes, so update Next first, then wp-config.

---

## 4. Infrastructure checklist (hosting / ops, per client site)

Not code — these are the layers this repo can't provide, to be done for each
site built from this template.

- [ ] **Lock the WordPress origin to the CDN.** Firewall the origin so it only
      accepts connections from Cloudflare / the CDN's published IP ranges. This
      is what makes `ch_client_ip()`'s forwarded headers trustworthy **and**
      stops an attacker bypassing edge rate-limit rules by hitting the origin
      directly.
- [ ] **Edge WAF rate-limit rules** (Cloudflare / Vercel WAF):
  - `POST` to the WPGraphQL endpoint path — e.g. 30 req / min / IP.
  - `POST` to the Next.js app (Server Actions) — e.g. 60 req / min / IP.
  - Enable Bot Fight Mode / Attack Challenge Mode.
- [ ] **WPGraphQL** — the code pins introspection/GraphiQL/batching/depth, but
      also confirm in `wp-admin → GraphQL` that nothing overrides it, and that
      query-cost/complexity analysis is on.
- [ ] **WordPress hardening** unrelated to comments but worth doing on every
      fork:
  - Disable XML-RPC (`xmlrpc.php`) if unused.
  - Disable the REST API comment-**write** route if only GraphQL is used.
  - Limit-login-attempts + 2FA on all admin accounts.
  - Keep core / WPGraphQL / ACF patched; enable auto-updates for security
    releases.
  - Akismet installed (even with auto-approve on, it can silently spam-bin —
    `preprocess_comment` still runs, so obvious spam never publishes).
- [ ] **Monitoring / alerting:**
  - Alert on a spike in comment volume (WAF analytics or a WP plugin).
  - Review the PHP error log for `Creator Hub Security:
    CREATOR_HUB_GRAPHQL_PROXY_SECRET is not set` — it must never appear in
    production.
  - Alert on 4xx spikes at `/graphql`.

---

## 5. Residual risk & the escape hatch

**Auto-approve is a policy choice, kept on deliberately.** With every control
above in place, a determined actor using a CAPTCHA-solving service and rotating
residential IPs can still get *some* comments published before rate limits and
score thresholds catch the pattern. The controls raise the cost and slow the
rate; they don't make it zero.

**If a comment-spam incident happens, the immediate fix is one WordPress
setting**, no deploy required:

> `Settings → Discussion → "Comment must be manually approved"` → **on**

The frontend already handles this correctly — `CommentsFeed` only ever renders
approved comments, and the form shows a neutral "may take a minute to appear"
either way. A softer option is *"Comment author must have a previously approved
comment"* (first comment held, subsequent ones auto-approve).

### Optional future hardening (not done — each has a real trade-off)

- **Nonce + `strict-dynamic` CSP** — removes `script-src 'unsafe-inline'`, which
  would neutralise stored XSS even if all three sanitizers were bypassed. Cost:
  a per-request nonce forces **every page to render dynamically** — the site
  loses static generation / ISR. Needs a go/no-go with that understood.
- **Trusted Types** (`require-trusted-types-for 'script'`, report-only first) —
  hardens the `dangerouslySetInnerHTML` sink specifically, and is compatible
  with static rendering. Risk: GTM is not fully Trusted-Types compliant; roll
  out report-only and watch the violation reports.
- **Distributed rate limiter** (Upstash / Vercel KV) behind `checkRateLimit` —
  makes the Next pre-filter a real cross-instance limit rather than a
  per-instance one.
- **Cloudflare Turnstile** instead of reCAPTCHA v3 — no Google dependency, no
  badge, similar friction. Swap is localized to `useRecaptchaV3` + `verifyRecaptcha`.
