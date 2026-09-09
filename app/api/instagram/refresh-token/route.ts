/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { refreshInstagramAccessToken } from "@/api/Instagram/GetAllInstagramFeedContent";
import { getInstagramToken, persistInstagramToken } from "@/config/instagramToken";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Instagram token refresh cron XXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export const dynamic = "force-dynamic";

/**
 * Weekly cron (see `vercel.json`) that keeps the Instagram long-lived token
 * alive: reads the current token, refreshes it (resetting its 60-day life), and
 * writes the new value to Edge Config so the running app picks it up without a
 * redeploy — see `config/instagramToken.ts`.
 *
 * Vercel automatically sends `Authorization: Bearer $CRON_SECRET` on scheduled
 * invocations; any request without that exact header is rejected, so the
 * endpoint can't be triggered by anyone else. The token is never logged or
 * returned in the response.
 */
export const GET = async (request: Request): Promise<Response> => {
	const secret = process.env.CRON_SECRET;
	if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const current = await getInstagramToken();
	if (!current) {
		return NextResponse.json(
			{ ok: false, error: "No Instagram token configured (INSTAGRAM_ACCESS_TOKEN / Edge Config both empty)." },
			{ status: 500 },
		);
	}

	const refreshed = await refreshInstagramAccessToken(current);
	if (!refreshed) {
		return NextResponse.json(
			{ ok: false, error: "Instagram refresh call failed — token may be expired; a manual re-auth is needed." },
			{ status: 502 },
		);
	}

	const persisted = await persistInstagramToken(refreshed.accessToken);
	const expiresAt = refreshed.expiresAt.toISOString();

	// Drop the cached feed so it refetches with the new token promptly rather
	// than up to an hour later.
	if (persisted) revalidateTag("instagram-feed", "max");

	if (!persisted) {
		return NextResponse.json(
			{ ok: false, persisted: false, expiresAt, error: "Token refreshed but not persisted — check EDGE_CONFIG / VERCEL_API_TOKEN; see logs for the new token." },
			{ status: 500 },
		);
	}

	return NextResponse.json({ ok: true, persisted: true, expiresAt });
};
