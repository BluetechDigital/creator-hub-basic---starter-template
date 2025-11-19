/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Import XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { Metadata, NextPage } from "next";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import Error from "@/components/Global/Error/Error";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Metadata XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

export const metadata: Metadata = {
	title: "404 - Not Found",
	description: "The page you are looking for does not exist.",
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXX 404 Not Found Page Component XXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const NotFound: NextPage = async () => {
	return <Error/>;
};

NotFound.displayName = 'NotFound';

export default NotFound;
