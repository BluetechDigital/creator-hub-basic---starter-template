import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

const request = (path: string, init?: { acceptLanguage?: string; cookie?: string }) => {
	const headers = new Headers();
	if (init?.acceptLanguage) headers.set("accept-language", init.acceptLanguage);
	if (init?.cookie) headers.set("cookie", init.cookie);

	return new NextRequest(new URL(`https://example.test${path}`), { headers });
};

describe("proxy", () => {
	it("does not redirect a pathname that already has a supported locale prefix", () => {
		// No longer `undefined` — proxy() now always returns a response (even
		// the pass-through case) so it can attach this request's CSP header;
		// "not redirected" is "no Location header", not "no response at all".
		for (const path of ["/fr/posts/hello", "/en"]) {
			const response = proxy(request(path));
			expect(response?.headers.get("location")).toBeNull();
		}
	});

	it("redirects to the default locale when there's no cookie or Accept-Language match", () => {
		const response = proxy(request("/posts/hello"));

		expect(response?.status).toBe(307);
		expect(response?.headers.get("location")).toBe("https://example.test/en/posts/hello");
	});

	it("redirects to the Accept-Language-preferred locale when no cookie is set", () => {
		const response = proxy(request("/posts/hello", { acceptLanguage: "de-DE,de;q=0.9,en;q=0.5" }));

		expect(response?.headers.get("location")).toBe("https://example.test/de/posts/hello");
	});

	it("falls back to the default locale when Accept-Language has no supported match", () => {
		const response = proxy(request("/", { acceptLanguage: "ja-JP,ja;q=0.9" }));

		expect(response?.headers.get("location")).toBe("https://example.test/en");
	});

	it("prefers the NEXT_LOCALE cookie over the Accept-Language header", () => {
		const response = proxy(request("/posts", {
			acceptLanguage: "de-DE,de;q=0.9",
			cookie: "NEXT_LOCALE=es",
		}));

		expect(response?.headers.get("location")).toBe("https://example.test/es/posts");
	});

	it("ignores an unsupported NEXT_LOCALE cookie value and falls through to the header", () => {
		const response = proxy(request("/posts", {
			acceptLanguage: "de-DE,de;q=0.9",
			cookie: "NEXT_LOCALE=ja",
		}));

		expect(response?.headers.get("location")).toBe("https://example.test/de/posts");
	});

	it("preserves the search string across the redirect", () => {
		const response = proxy(request("/posts?category=news"));

		expect(response?.headers.get("location")).toBe("https://example.test/en/posts?category=news");
	});

	describe("Content-Security-Policy nonce", () => {
		it("sets a nonce-based CSP on a pass-through (non-redirect) request", () => {
			const response = proxy(request("/en/posts/hello"));
			const csp = response?.headers.get("content-security-policy");

			expect(csp).toBeTruthy();
			expect(csp).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);

			// script-src specifically must not fall back to 'unsafe-inline' —
			// style-src still legitimately carries it (out of scope for this
			// change), so check just the script-src directive, not the whole string.
			const scriptSrc = csp?.match(/script-src [^;]+/)?.[0];
			expect(scriptSrc).not.toContain("'unsafe-inline'");
		});

		it("forwards the same nonce as an x-nonce request header, for Server Components to read", () => {
			const req = request("/en/posts/hello");
			const response = proxy(req);

			const csp = response?.headers.get("content-security-policy");
			const nonceInCsp = csp?.match(/'nonce-([^']+)'/)?.[1];

			// NextResponse.next({ request: { headers } }) surfaces the rewritten
			// request headers via this response header — see next/server's own
			// middleware contract, not something proxy.ts sets directly.
			const forwardedNonce = response?.headers.get("x-middleware-request-x-nonce");

			expect(nonceInCsp).toBeTruthy();
			expect(forwardedNonce).toBe(nonceInCsp);
		});

		it("generates a different nonce on every call", () => {
			const first = proxy(request("/en"))?.headers.get("content-security-policy");
			const second = proxy(request("/en"))?.headers.get("content-security-policy");

			expect(first).not.toBe(second);
		});

		it("also sets a CSP on a redirect response, for consistency", () => {
			const response = proxy(request("/posts/hello"));
			expect(response?.headers.get("content-security-policy")).toBeTruthy();
		});
	});
});
