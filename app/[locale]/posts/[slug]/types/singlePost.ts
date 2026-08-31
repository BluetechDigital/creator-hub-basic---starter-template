/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import type { IDictionary } from "@/i18n/dictionaries";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Dictionary Type XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// This route's `singlePost` dictionary slice — `page.tsx` fetches it once
// (`getDictionary(locale)`) and threads it down unstripped as a `dict` prop
// into every Client Component fragment under `posts/[slug]/fragments/` that
// needs translated UI strings (`ShareLinks`, `CommentsFeed`, `CommentForm`),
// since none of those can call `getDictionary()` themselves — same pattern as
// `IVideosDict` in `components/CMS/AllYoutubeVideos/types/allYouTubeVideos.ts`.
// A type-only import, erased at compile time, so it doesn't pull `dictionaries.ts`'s
// `import "server-only"` guard into any of those Client Components' bundles.
export type ISinglePostDict = IDictionary["singlePost"];
