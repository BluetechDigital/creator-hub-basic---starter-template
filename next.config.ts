/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import type { NextConfig } from "next";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXX Load environment variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

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
					// Content Security Policy (CSP) to allow the CMS and Instagram
					{
						key: "Content-Security-Policy",
						value: `
							default-src 'self';
							img-src 'self' ${process.env.CMS_URL} ${process.env.IMAGE_REMOTE_PATTERNS_HOSTNAME_ONE} ${process.env.IMAGE_REMOTE_PATTERNS_HOSTNAME_TWO} ${process.env.YOUTUBE_IMAGE_REMOTE_PATTERNS_HOSTNAME} ${process.env.INSTAGRAM_IMAGE_REMOTE_PATTERNS_HOSTNAME} data:;
							script-src 'self' 'unsafe-inline' 'unsafe-eval';
							style-src 'self' 'unsafe-inline';
							connect-src 'self' ${process.env.CMS_URL};
							frame-src 'self' ${process.env.YOUTUBE_EMBED_REMOTE_PATTERNS_HOSTNAME}; /* Allow embedding YouTube videos */
							object-src 'none';
							frame-ancestors 'none';`
							.replace(/\s{2,}/g, " ")
							.trim(),
					},
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
				source: "/[slug]",
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
		],
	}
};

export default nextConfig;
