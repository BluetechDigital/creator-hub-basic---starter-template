/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import * as IFlexibleContent from "@/graphql/CMS/types/flexibleContent";
import * as IPost from "@/graphql/CMS/types/post";
import type { IDictionary } from "@/i18n/dictionaries";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export type IProps = IFlexibleContent.IBaseFixedProps & {
	/**
	 * ACF field — dynamic heading for the archive header. NOT YET queried in
	 * `graphql/index.ts`'s fragment (see that file's doc comment for why) — always
	 * `undefined` until that one-line addition is confirmed and made, so it stays
	 * optional and `AllBlogPosts.tsx` falls back to a generic default heading.
	 */
	title?: string;
	/**
	 * Not an ACF field — the archive's tag/category/date filters, parsed from this
	 * route's query params in `app/[locale]/posts/page.tsx` and threaded down through
	 * `RenderFlexibleContent`/`ResolvedBlock` alongside every block's normal ACF
	 * props (see those files' doc comments).
	 */
	filters?: IPost.IPostFilters;
};

export type IPostsGrid = {
	posts: IPost.ISummaryProps[];
	/** Only `empty`/`showMore` are read (from the `posts`/`common` dictionary slices). */
	dict: Pick<IDictionary["posts"], "empty"> & Pick<IDictionary["common"], "showMore">;
};

export type IPostCard = {
	post: IPost.ISummaryProps;
};
