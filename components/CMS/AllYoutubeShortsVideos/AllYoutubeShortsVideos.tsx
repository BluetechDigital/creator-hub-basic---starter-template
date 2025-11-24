/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, memo } from "react";
import * as IAllYoutubeShortsVideos from "@/components/CMS/AllYoutubeShortsVideos/types/allYoutubeShortsVideos";

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
XXXXX Fetch all Youtube Creator Content simultaneously using Promise.all XXXXXXX
----------------------------------------------------------------------------- */

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

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Styling XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import styles from "@/components/CMS/AllYoutubeShortsVideos/styles/AllYoutubeShortsVideos.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import VideosGrid from "@/components/CMS/AllYoutubeShortsVideos/fragments/VideosGrid";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXX AllYoutubeShortsVideos Component XXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const AllYoutubeShortsVideos: FC<IAllYoutubeShortsVideos.IProps> = memo(({}) => {

	return (
		<div className={styles.allYouTubeShortsVideos}>
			<VideosGrid
				youtubeVideos={youtubeVideos}
				youtubeChannelInfo={youtubeChannelInfo}
				youtubeChannelPlaylists={youtubeChannelPlaylists}
			/>
		</div>
	);
});

AllYoutubeShortsVideos.displayName = 'AllYoutubeShortsVideos';

export default AllYoutubeShortsVideos;
