import { describe, it, expect, afterEach, vi } from "vitest";

/* -----------------------------------------------------------------------------
CMS_URL is read into a module-scope const on import — see
api/YouTube/GetAllYoutubeContent.test.ts's doc comment for why that means
each test needs a fresh module import after setting process.env.
----------------------------------------------------------------------------- */

const originalEnv = { ...process.env };

const importFreshRoute = async () => {
	vi.resetModules();
	return import("./route");
};

const requestWithPath = async (path: string[]) => {
	const { GET } = await importFreshRoute();
	return GET(new Request("https://example.test/api/media"), { params: Promise.resolve({ path }) });
};

describe("GET /api/media/[...path]", () => {
	afterEach(() => {
		process.env = { ...originalEnv };
		vi.unstubAllGlobals();
	});

	it("responds 503 when CMS_URL isn't configured", async () => {
		delete process.env.CMS_URL;

		const res = await requestWithPath(["2024", "01", "x.png"]);
		expect(res.status).toBe(503);
	});

	it("fetches from under wp-content/uploads/ even for a path that looks like a WP core file — it can never reach outside that directory without a traversal segment", async () => {
		process.env.CMS_URL = "https://cms.example.test";
		const mockFetch = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));
		vi.stubGlobal("fetch", mockFetch);

		// "wp-login.php" here is just a filename under uploads/, not the CMS's
		// actual wp-login.php at the root — there's no longer an
		// allowlist-of-prefixes check to bypass; every request this route
		// serves is unconditionally scoped under wp-content/uploads/.
		await requestWithPath(["wp-login.php"]);

		expect(mockFetch).toHaveBeenCalledWith(
			"https://cms.example.test/wp-content/uploads/wp-login.php",
			expect.anything(),
		);
	});

	it("responds 404 for a path-traversal attempt trying to escape wp-content/uploads/", async () => {
		process.env.CMS_URL = "https://cms.example.test";
		const mockFetch = vi.fn();
		vi.stubGlobal("fetch", mockFetch);

		// "../../wp-login.php" would resolve to ${CMS_URL}/wp-login.php once
		// fetch() parses it as a URL, walking back up out of
		// wp-content/uploads/ entirely — this must be rejected before ever
		// reaching fetch.
		const res = await requestWithPath(["..", "..", "wp-login.php"]);

		expect(res.status).toBe(404);
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it("streams a successful upstream response with the right headers, from under wp-content/uploads/", async () => {
		process.env.CMS_URL = "https://cms.example.test";
		const mockFetch = vi.fn().mockResolvedValue(
			new Response("%PDF-1.4 fake bytes", {
				status: 200,
				headers: { "content-type": "application/pdf" },
			}),
		);
		vi.stubGlobal("fetch", mockFetch);

		const res = await requestWithPath(["2024", "example.pdf"]);

		expect(mockFetch).toHaveBeenCalledWith(
			"https://cms.example.test/wp-content/uploads/2024/example.pdf",
			expect.objectContaining({ next: { revalidate: 86400 } }),
		);
		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toBe("application/pdf");
		expect(res.headers.get("content-disposition")).toBe("inline");
		expect(await res.text()).toBe("%PDF-1.4 fake bytes");
	});

	it("responds 404 when the upstream CMS 404s", async () => {
		process.env.CMS_URL = "https://cms.example.test";
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404 })));

		const res = await requestWithPath(["missing.png"]);
		expect(res.status).toBe(404);
	});

	it("responds 502 when the upstream fetch throws", async () => {
		process.env.CMS_URL = "https://cms.example.test";
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

		const res = await requestWithPath(["x.png"]);
		expect(res.status).toBe(502);
	});
});
