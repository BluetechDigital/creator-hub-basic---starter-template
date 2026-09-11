/* -----------------------------------------------------------------------------
Canned data the fake WPGraphQL server returns. Kept as plain JS objects (not
JSON files) so they're easy to edit and reference each other.

Page slugs the CMS pipeline knows about:
  - "Home"        home page: a TitleParagraph + an AllBlogPosts block
  - "test-page"   a generic /[slug] page: a TitleParagraph block
  - "Posts"       blog archive shell: an AllBlogPosts block
  - "Videos"      video archive shell: AllYoutubeVideos + AllYoutubeShortsVideos
  - "contact"     a ContactForm block
  - "empty-page"  valid response, ZERO blocks (renders nothing, must not crash)
  - "broken-page" GraphQL returns { errors } (null-content regression guard)
----------------------------------------------------------------------------- */

const FC_PREFIX = "DefaultTemplate_Flexiblecontent_FlexibleContent";
const block = (name, fields = {}) => ({
	fieldGroupName: `${FC_PREFIX}_${name}`,
	displaySection: true,
	...fields,
});

// Full Pass-2 block content, keyed by page slug.
export const PAGE_BLOCKS = {
	Home: [
		block("TitleParagraph", {
			title: "Welcome to the Creator Hub",
			paragraph: "<p>This is the home page introduction, authored in the CMS.</p>",
			displayParagraph: true,
		}),
		block("AllBlogPosts", { title: "Latest from the blog" }),
	],
	"test-page": [
		block("TitleParagraph", {
			title: "A generic CMS page",
			paragraph: "<p>Rendered from ACF flexible-content blocks, no per-page code.</p>",
			displayParagraph: false,
		}),
	],
	Posts: [block("AllBlogPosts", { title: "The blog" })],
	Videos: [block("AllYoutubeVideos", { title: "Videos" }), block("AllYoutubeShortsVideos", { title: "Shorts" })],
	contact: [block("ContactForm")],
	"empty-page": [],
};

// Pass-1 is the same shape with only fieldGroupName.
export const pageFieldGroupNames = (slug) =>
	(PAGE_BLOCKS[slug] ?? []).map((b) => ({ fieldGroupName: b.fieldGroupName }));

// SEO — one object reused for every slug, `title` varies so specs can assert it.
export const seoFor = (slug) => ({
	canonical: `http://localhost:3000/${slug === "Home" ? "" : slug}`,
	cornerstone: false,
	focuskw: "",
	fullHead: "",
	metaDesc: `Meta description for ${slug}.`,
	metaKeywords: "",
	metaRobotsNofollow: "",
	metaRobotsNoindex: "",
	opengraphAuthor: "",
	opengraphDescription: `OG description for ${slug}.`,
	opengraphImage: { mediaItemUrl: "https://secure.gravatar.com/avatar/00000000000000000000000000000000?d=mp&s=1200" },
	opengraphModifiedTime: "2026-01-01T00:00:00+00:00",
	opengraphPublishedTime: "2026-01-01T00:00:00+00:00",
	opengraphPublisher: "",
	opengraphSiteName: "Creator Hub E2E",
	opengraphTitle: `${slug} — Creator Hub E2E`,
	opengraphType: "website",
	opengraphUrl: `http://localhost:3000/${slug === "Home" ? "" : slug}`,
	readingTime: 3,
	title: `${slug} — Creator Hub E2E`,
	twitterDescription: "",
	twitterTitle: "",
	twitterImage: { mediaItemUrl: "https://secure.gravatar.com/avatar/00000000000000000000000000000000?d=mp&s=1200" },
});

// Post summaries for the archive grid + "latest posts". `slug` is the assertion handle.
const AVATAR = "https://secure.gravatar.com/avatar/00000000000000000000000000000000?d=mp";
const FEATURED = { node: { sourceUrl: "https://secure.gravatar.com/avatar/11111111111111111111111111111111?d=identicon&s=800", altText: "" } };

export const ALL_POSTS = [
	{
		title: "First fixture post", slug: "first-fixture-post", "date": "2026-03-01T09:00:00",
		excerpt: "<p>Excerpt for the first fixture post.</p>", featuredImage: FEATURED,
		categories: { nodes: [{ name: "News", slug: "news" }] },
		tags: { nodes: [{ name: "Launch", slug: "launch" }] }, seo: { readingTime: 2 },
	},
	{
		title: "Second fixture post", slug: "second-fixture-post", "date": "2026-02-15T09:00:00",
		excerpt: "<p>Excerpt for the second fixture post.</p>", featuredImage: FEATURED,
		categories: { nodes: [{ name: "Guides", slug: "guides" }] },
		tags: { nodes: [{ name: "Howto", slug: "howto" }] }, seo: { readingTime: 5 },
	},
	{
		title: "Third fixture post", slug: "third-fixture-post", "date": "2026-01-20T09:00:00",
		excerpt: "<p>Excerpt for the third fixture post.</p>", featuredImage: FEATURED,
		categories: { nodes: [{ name: "News", slug: "news" }] },
		tags: { nodes: [{ name: "Update", slug: "update" }] }, seo: { readingTime: 4 },
	},
	{
		title: "Fourth fixture post", slug: "fourth-fixture-post", "date": "2026-01-05T09:00:00",
		excerpt: "<p>Excerpt for the fourth fixture post.</p>", featuredImage: FEATURED,
		categories: { nodes: [{ name: "Guides", slug: "guides" }] },
		tags: { nodes: [{ name: "Howto", slug: "howto" }] }, seo: { readingTime: 6 },
	},
	{
		title: "Fifth fixture post", slug: "fifth-fixture-post", "date": "2025-12-10T09:00:00",
		excerpt: "<p>Excerpt for the fifth fixture post.</p>", featuredImage: FEATURED,
		categories: { nodes: [{ name: "News", slug: "news" }] },
		tags: { nodes: [{ name: "Update", slug: "update" }] }, seo: { readingTime: 3 },
	},
];

// Filter the fixture posts by the same where-args the real query supports.
export const filterPosts = (variables = {}) => {
	let posts = ALL_POSTS;
	if (variables.categoryName) posts = posts.filter((p) => p.categories.nodes.some((c) => c.slug === variables.categoryName));
	if (Array.isArray(variables.tagSlugIn) && variables.tagSlugIn.length)
		posts = posts.filter((p) => p.tags.nodes.some((t) => variables.tagSlugIn.includes(t.slug)));
	if (variables.search) posts = posts.filter((p) => p.title.toLowerCase().includes(String(variables.search).toLowerCase()));

	// Cursor pagination — `AllBlogPosts.tsx` always requests `first: 24` (there's
	// no "Load more"/paged UI yet, see its own doc comment), so in practice this
	// just returns every fixture post that matches the filter in one page.
	const pageSize = variables.first ?? 24;
	const startIndex = variables.after ? Number(variables.after) : 0;
	const slice = posts.slice(startIndex, startIndex + pageSize);
	const nextIndex = startIndex + pageSize;
	return {
		nodes: slice,
		pageInfo: {
			hasNextPage: nextIndex < posts.length,
			endCursor: nextIndex < posts.length ? String(nextIndex) : null,
		},
	};
};

export const FILTER_OPTIONS = {
	categories: { nodes: [{ name: "News", slug: "news" }, { name: "Guides", slug: "guides" }] },
	tags: { nodes: [{ name: "Launch", slug: "launch" }, { name: "Howto", slug: "howto" }, { name: "Update", slug: "update" }] },
};

// A single post for /posts/[slug].
export const postBySlug = (slug) => ({
	databaseId: 101,
	title: `Fixture article: ${slug}`,
	slug,
	date: "2026-03-01T09:00:00",
	modified: "2026-03-02T09:00:00",
	content: "<h2>A heading</h2><p>The article body, authored in WordPress.</p>",
	excerpt: "<p>Article excerpt.</p>",
	featuredImage: FEATURED,
	author: { node: { name: "Fixture Author", url: "", description: "", avatar: { url: AVATAR } } },
	categories: { nodes: [{ name: "News", slug: "news" }] },
	tags: { nodes: [{ name: "Launch", slug: "launch" }] },
	seo: { readingTime: 4 },
});

// GetPostComments unwraps `data.post.{commentCount,comments.nodes}` — see
// graphql/CMS/GetPostComments.ts.
export const COMMENTS_EMPTY = { commentCount: 0, comments: { nodes: [] } };

export const THEME_OPTIONS_EMPTY = { edges: [] };
export const MENU_LINKS_EMPTY = { edges: [] };

// app/sitemap.ts's two slug queries (GetAllPagesSlugs/GetAllPostsSlugs) — anonymous
// queries, matched by query text in router.mjs. `modified`/`publishedAt` are fixed
// so the generated <lastmod> is deterministic for assertions.
export const PAGE_SLUGS = [
	{ slug: "test-page", modified: "2026-01-01 00:00:00" },
	{ slug: "contact", modified: "2026-01-01 00:00:00" },
];
export const POST_SLUGS = ALL_POSTS.map((p) => ({ slug: p.slug, modified: "2026-01-01 00:00:00" }));

// Minimal YouTube Data API shapes — enough that AllYoutubeVideos degrades to an
// empty grid rather than throwing.
export const YT_EMPTY_LIST = { kind: "youtube#playlistItemListResponse", items: [], pageInfo: { totalResults: 0, resultsPerPage: 0 } };
export const YT_CHANNEL = {
	kind: "youtube#channelListResponse",
	items: [{
		id: "e2e-channel",
		snippet: { title: "E2E Channel", description: "", thumbnails: { high: { url: AVATAR } } },
		contentDetails: { relatedPlaylists: { uploads: "e2e-uploads" } },
		statistics: { viewCount: "0", subscriberCount: "0", videoCount: "0" },
	}],
};
