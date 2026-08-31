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
		expect(proxy(request("/fr/posts/hello"))).toBeUndefined();
		expect(proxy(request("/en"))).toBeUndefined();
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
});
