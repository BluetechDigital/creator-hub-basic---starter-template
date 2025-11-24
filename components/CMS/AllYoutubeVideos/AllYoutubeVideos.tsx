/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC, memo } from "react";
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

import styles from "@/components/CMS/AllYoutubeVideos/styles/AllYoutubeVideos.module.css";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import VideosGrid from "@/components/CMS/AllYoutubeVideos/fragments/VideosGrid";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXX AllYoutubeVideos Component XXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const AllYoutubeVideos: FC<IAllYoutubeVideos.IProps> = memo(async ({ }) => {

	return (
		<div className={styles.allYoutubeVideos}>
			<VideosGrid
				youtubeVideos={youtubeVideos}
				youtubeChannelInfo={youtubeChannelInfo}
				youtubeChannelPlaylists={youtubeChannelPlaylists}
			/>
		</div>
	);
});

AllYoutubeVideos.displayName = 'AllYoutubeVideos';

export default AllYoutubeVideos;
