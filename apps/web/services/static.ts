import { GetStaticPaths, GetStaticProps } from "next";
import { NOUN_TOKEN_ADDRESS } from "../utils/address";
import { configLookup, NounishConfig } from "./ServiceContext";
import { GraphQLClient } from "graphql-request";
import { SubgraphService } from "./subgraph.service";
import { Noun } from "./interfaces/noun.service";
// import { PAGE_SIZE } from "../utils/pagination";

export type StaticParams = {
  address: string;
};

export type StaticProps = {
  config: NounishConfig;
  address: string;
  nouns: Noun[];
};

export const getStaticAuctionProps: GetStaticProps<
  StaticProps,
  StaticParams
> = async () => {
  const address = NOUN_TOKEN_ADDRESS;
  const config = configLookup(address);
  if (!config) {
    // TODO - derive config from user entry for new contracts
    throw new Error("No Matching Config for address");
  }

  const client = new GraphQLClient(config.baseURI);
  const service = new SubgraphService(address, client);
  const nouns: Noun[] = await service.getNouns();

  return {
    props: { address, config, nouns },
    revalidate: 30,
  };
};

export const getFallbackStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: true,
  };
};
