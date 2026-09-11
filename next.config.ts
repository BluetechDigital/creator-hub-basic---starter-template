/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	
  /* config options here */
  reactStrictMode: true,
  poweredByHeader: false, // Disables the X-Powered-By header
  
  /* All routes edge network caching */
	async headers() {
		return [
			// Specific rule for /search to disable caching
            {
                source: "/search",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "no-store, no-cache, must-revalidate, proxy-revalidate",
                    },
                    {
                        key: "Pragma",
                        value: "no-cache",
                    },
                    {
                        key: "Expires",
                        value: "0",
                    },
                ],
            },
			{
				source: "/(.*)", // Match all routes (adjust as necessary)
				headers: [
					// Force HTTPS
					{
						key: "Strict-Transport-Security",
						value: "max-age=31536000; includeSubDomains; preload",
					},
					// Prevent MIME-type sniffing
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					// Prevent clickjacking
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					// Prevent reflected XSS attacks
					{
						key: "X-XSS-Protection",
						value: "1; mode=block",
					},
					// Content-Security-Policy is NOT set here — it needs a fresh,
					// unpredictable nonce on every single request (script-src allows
					// only a <script> carrying that request's own nonce, not
					// 'unsafe-inline'), and this headers() config is static, evaluated
					// once at build/start time, not per-request. It's generated fresh
					// per-request in proxy.ts instead — see that file's own doc comment.

					// Referrer Policy
					{
						key: "Referrer-Policy",
						value: "no-referrer",
					},
					// Permissions-Policy to restrict features like microphone, geolocation, etc.
					{
						key: "Permissions-Policy",
						value: "geolocation=(), microphone=(), camera=(), payment=()",
					},
					// Certificate Transparency (Expect-CT)
					{
						key: "Expect-CT",
						value: "max-age=86400, enforce",
					},
				],
			},
			{
				// Was "/[slug]" — updated for the /[locale]/[slug] route depth once
				// every page moved under app/[locale]/ for internationalization.
				source: "/:locale/:slug",
				headers: [
					{
						key: "Cache-Control",
						value: "s-maxage=1, stale-while-revalidate=259200",
					},
				],
			},
			{
				source: "/_next/image",
				headers: [
					{
						key: "Cache-Control",
						value: "s-maxage=1, stale-while-revalidate=259200",
					},
				],
			},
		];
	},
  
  /* Force HTTPS Redirects */
  async redirects() {
		if (process.env.NODE_ENV !== "production") {
			return [];
		}
		return [
			{
				source: "/(.*)",
				has: [
					{
						type: "header",
						key: "x-forwarded-proto",
						value: "http",
					},
				],
				permanent: true,
				destination: `${process.env.SITE_URL}/$1`,
			},
		];
	},
  
  /* Image Optimization Configuration */
  images: {
		formats: ['image/avif', 'image/webp'],
		remotePatterns: [
			{
				protocol: "https",
				hostname: `${process.env.IMAGE_REMOTE_PATTERNS_HOSTNAME_ONE}`,
				port: "",
				pathname: `${process.env.IMAGE_REMOTE_PATHNAME_ONE}/**`,
			},
			{
				protocol: "https",
				hostname: `${process.env.IMAGE_REMOTE_PATTERNS_HOSTNAME_TWO}`,
				port: "",
				pathname: `${process.env.IMAGE_REMOTE_PATHNAME_TWO}/**`,
			},
			{
				protocol: "https",
				hostname: `${process.env.YOUTUBE_IMAGE_REMOTE_PATTERNS_HOSTNAME}`,
				port: "",
				pathname: `${process.env.YOUTUBE_IMAGE_REMOTE_PATHNAME}/**`,
			},
			{
				protocol: "https",
				hostname: `${process.env.INSTAGRAM_IMAGE_REMOTE_PATTERNS_HOSTNAME}`,
				port: "",
				pathname: `${process.env.INSTAGRAM_IMAGE_REMOTE_PATHNAME}/**`,
			},
			{
				protocol: "https",
				hostname: `${process.env.INSTAGRAM_IMAGE_REMOTE_PATTERNS_HOSTNAME_TWO}`,
				port: "",
				pathname: `${process.env.INSTAGRAM_IMAGE_REMOTE_PATHNAME_TWO || "/**"}`,
			},
			{
				// WordPress author avatars — a fixed, universal host (not client-specific
				// like the CMS/YouTube/Instagram hosts above), so hardcoded rather than
				// read from an env var.
				protocol: "https",
				hostname: "secure.gravatar.com",
				port: "",
				pathname: "/avatar/**",
			},
		],
	}
};

export default nextConfig;
