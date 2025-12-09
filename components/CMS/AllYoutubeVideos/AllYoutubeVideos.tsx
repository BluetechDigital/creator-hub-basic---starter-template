/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, memo, Suspense } from "react";
import * as IAllYoutubeVideos from "@/components/CMS/AllYoutubeVideos/types/allYouTubeVideos";

// Youtube Api Info
import {
	IYoutubeVideos,
	IYoutubePlaylists,
	IYoutubeChannelInfo,
	getAllYoutubeVideos,
	getAllYoutubePlaylists,
	getAllYoutubeChannelInfo,
} from "@/api/YouTube/GetAllYoutubeContent";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/AllYoutubeVideos/styles/AllYoutubeVideos.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import VideosGrid from "@/components/CMS/AllYoutubeVideos/fragments/VideosGrid";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX AllYoutubeVideos Component XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const AllYoutubeVideos: FC<IAllYoutubeVideos.IProps> = memo(async ({ }) => {

	// Fetch all Youtube Creator Content simultaneously using Promise.all
	const promises: (Promise<IYoutubeVideos> | Promise<IYoutubePlaylists> | Promise<IYoutubeChannelInfo>)[] = [
		getAllYoutubeVideos(),
		getAllYoutubePlaylists(),
		getAllYoutubeChannelInfo(),
	];

	const [
		youtubeVideos,
		youtubeChannelPlaylists,
		youtubeChannelInfo,
	] = await Promise.all(promises);

	return (
		<div className={styles.allYoutubeVideos}>
			<Suspense fallback={<div>Loading...</div>}>
				<VideosGrid
					youtubeVideos={youtubeVideos}
					youtubeChannelInfo={youtubeChannelInfo}
					youtubeChannelPlaylists={youtubeChannelPlaylists}
				/>
			</Suspense>
		</div>
	);
});

AllYoutubeVideos.displayName = 'AllYoutubeVideos';

export default AllYoutubeVideos;
