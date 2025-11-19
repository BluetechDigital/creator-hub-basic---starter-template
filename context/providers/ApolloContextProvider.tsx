"use client";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX IMPORTS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

import { FC } from "react";
import { client } from "@/config/apollo";
import * as IApollo from "@/context/types/apollo";
import { ApolloProvider } from "@apollo/client/react";

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXX Apollo Context Provider XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

const ApolloContextProvider: FC<IApollo.IContextProvider> = ({children}) => {
	return <ApolloProvider client={client}>{children}</ApolloProvider>;
};

ApolloContextProvider.displayName = 'ApolloContextProvider';

export default ApolloContextProvider;
