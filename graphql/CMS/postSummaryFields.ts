/**
 * The `Post` field-selection shared by every query that returns a list of
 * post summaries (`GetAllPostsSummaries.ts`'s archive grid, `GetLatestPosts.ts`'s
 * "Latest news" section) — both fetch exactly the fields `IPost.ISummaryProps`
 * declares, so a future field addition only has to be made once here instead
 * of drifting between two hand-duplicated copies.
 *
 * `date: dateGmt` aliases WPGraphQL's GMT field back onto `date` — see
 * `GetPostContentBySlug.ts`'s doc comment for why, and why callers must use
 * `parseWpDate` rather than `new Date()` on it.
 */
export const POST_SUMMARY_FIELDS = `
	title
	slug
	date: dateGmt
	excerpt
	featuredImage {
		node {
			sourceUrl
			altText
		}
	}
	categories {
		nodes {
			name
			slug
		}
	}
	seo {
		readingTime
	}
`;
