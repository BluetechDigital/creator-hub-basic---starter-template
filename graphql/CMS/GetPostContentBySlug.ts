/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IPost from "@/graphql/CMS/types/post";
import { IGraphQLResponse } from "@/graphql/CMS/types/graphqlResponse";

const GRAPHQL_ENDPOINT: string | undefined = process.env.NEXT_PUBLIC_CMS_API_URL;
if (!GRAPHQL_ENDPOINT) throw new Error("NEXT_PUBLIC_CMS_API_URL not defined.");

/**
 * Fetches a single published blog post's rendering content (title, body, featured
 * image, author, categories) by slug. SEO metadata is fetched separately via the
 * already-generic `getAllSeoContent(slug, postType.posts)` — this function only
 * covers the fields the post's own body/breadcrumb rendering needs.
 *
 * Deliberately does NOT fetch `likes`/`dislikes` here — those are custom fields
 * from the simple-blogs-post-likes mu-plugin (see `wordpress-mu-plugins/`), which
 * may not be installed on every fork/environment. A GraphQL schema-validation
 * error (querying a field that doesn't exist) fails the *entire* request, not
 * just that field — so reactions are fetched separately via `getPostReactions`,
 * isolated so a missing plugin doesn't take down the rest of the post.
 *
 * Also deliberately does NOT fetch `commentCount`/`comments` here — those are
 * fetched separately via `getPostComments`, which uses a much shorter cache
 * (60s vs. this query's 24h). Confirmed live: a comment approved in wp-admin
 * didn't show up on the frontend until this query's 24h cache expired, since
 * "post content" and "comment count" have very different natural change
 * frequencies and folding them into one fetch meant they shared one cache
 * lifetime.
 *
 * `date: dateGmt` and `modified: modifiedGmt` alias WPGraphQL's GMT fields
 * back onto their friendlier names (so `IPost.IProps` doesn't need a rename)
 * — WPGraphQL's plain `date`/`modified` fields follow the WordPress site's
 * own local-timezone setting and, like `dateGmt`, come back with no UTC
 * marker either way, so parsing them naively with `new Date()` gets silently
 * misread as whatever timezone happens to run the code. Callers must run
 * these through `parseWpDate` rather than passing them to `new Date()`
 * directly — see that function's doc comment (this exact bug was confirmed
 * live on a comment date first, before being found here too).
 *
 * `slug` is passed as a `$slug` GraphQL variable, not interpolated into the
 * query string — it comes straight from the URL's route param, so a raw
 * `where: {name: "${slug}"}` interpolation would let a crafted slug (e.g.
 * containing a `"`) break out of the string literal and inject arbitrary
 * GraphQL syntax into the query.
 *
 * `tags(first: 5)` caps the tag pills `PostTaxonomies` renders at the source,
 * same as `postSummaryFields.ts` does for the "Latest news" cards.
 * @param slug The slug of the post to fetch content for.
 * @returns A promise resolving to the post's content fields, or `undefined` if the fetch/query failed or no post matched.
 */
export const getPostContentBySlug = async (slug: string): Promise<IPost.IProps | undefined> => {
	try {
		const content = `
			query GetPostContentBySlug($slug: String!) {
				posts(where: {name: $slug, status: PUBLISH}) {
					edges {
						node {
							databaseId
							title
							slug
							date: dateGmt
							modified: modifiedGmt
							content
							excerpt
							featuredImage {
								node {
									sourceUrl
									altText
								}
							}
							author {
								node {
									name
									url
									description
									avatar {
										url
									}
								}
							}
							categories {
								nodes {
									name
									slug
								}
							}
							tags(first: 5) {
								nodes {
									name
									slug
								}
							}
							seo {
								readingTime
							}
						}
					}
				}
			}
		`;

		const nextJSFetchResponse: Response = await fetch(GRAPHQL_ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query: content, variables: { slug } }),
			next: { revalidate: 86400 },
		});

		if (!nextJSFetchResponse.ok) {
			console.error(`Post content fetch failed with status: ${nextJSFetchResponse.status}`);
			return undefined;
		}

		const response: IGraphQLResponse<IPost.IResponse> = await nextJSFetchResponse.json();

		if (response.errors) {
			console.error(`Post content query for slug "${slug}" returned errors:`, response.errors);
			return undefined;
		}

		return response?.data?.posts?.edges?.[0]?.node;

	} catch (error: unknown) {
		console.log(error);
		throw new Error(
			`Something went wrong trying to fetch post content for slug "${slug}"`
		);
	}
};
