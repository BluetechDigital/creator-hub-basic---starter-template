/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import "server-only";
import { headers } from "next/headers";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXX In-memory sliding window XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * A tiny per-process sliding-window rate limiter for the comment/reaction
 * Server Actions.
 *
 * This is a *pre-filter*, not the authoritative control — a serverless
 * deployment runs many instances, each with its own `Map`, and a cold start
 * resets it. The real per-visitor rate limit lives server-side in the
 * `ch-security.php` mu-plugin (WP transients = shared DB/object-cache state),
 * which every mutation must pass through. This just turns away the cheap,
 * high-volume abuse before it costs a WordPress round trip. For a
 * cross-instance guarantee, back this with Upstash / Vercel KV — the call
 * sites don't change.
 *
 * Entries are pruned lazily on read; a `MAX_KEYS` cap plus a hard sweep keep
 * the map bounded if it's ever hammered with unique keys.
 */
type IWindow = { count: number; resetAt: number };

const buckets = new Map<string, IWindow>();
const MAX_KEYS = 10_000;

const sweep = (now: number) => {
	for (const [key, window] of buckets) {
		if (window.resetAt <= now) buckets.delete(key);
	}
};

/**
 * @param key A stable identifier for the caller (e.g. `"comment:1.2.3.4"`).
 * @param limit Max requests allowed per window.
 * @param windowMs Window length in milliseconds.
 * @returns `true` if the request is within the limit, `false` if it should be rejected.
 */
export const checkRateLimit = (key: string, limit: number, windowMs: number): boolean => {
	const now = Date.now();

	if (buckets.size > MAX_KEYS) sweep(now);

	const existing = buckets.get(key);

	if (!existing || existing.resetAt <= now) {
		buckets.set(key, { count: 1, resetAt: now + windowMs });
		return true;
	}

	if (existing.count >= limit) {
		return false;
	}

	existing.count += 1;
	return true;
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Caller Identity XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * The requesting visitor's IP, from the CDN's forwarded headers (the direct
 * connection is the platform's edge, not the visitor). Falls back to a
 * constant so a missing header degrades to a single shared bucket rather than
 * bypassing the limit entirely.
 */
export const getRequestIp = async (): Promise<string> => {
	const store = await headers();
	const forwarded = store.get("x-forwarded-for");
	if (forwarded) {
		const first = forwarded.split(",")[0]?.trim();
		if (first) return first;
	}
	return store.get("x-real-ip") ?? store.get("cf-connecting-ip") ?? "unknown";
};
