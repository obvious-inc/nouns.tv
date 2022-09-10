import { getNounData } from "@nouns/assets";
import { GetStaticPaths, GetStaticProps } from "next";
import { getImageUrlFromSeed as getNounImageUrlFromSeed } from "../utils/nouns";
import { NOUN_TOKEN_ADDRESS } from "../utils/address";
import { configLookup, NounishConfig } from "./ServiceContext";
import { GraphQLClient } from "graphql-request";
import { SubgraphService } from "./subgraph.service";
import { Noun } from "./interfaces/noun.service";
// import { PAGE_SIZE } from "../utils/pagination";

const address = NOUN_TOKEN_ADDRESS;
const config = configLookup(address);

export type StaticParams = {
  "noun-id": string;
};

export type StaticProps = {
  config: NounishConfig;
  address: string;
  nouns: Noun[];
};

export const getStaticAuctionProps: GetStaticProps<
  StaticProps,
  StaticParams
> = async ({ params }) => {
  if (!config) throw new Error("No Matching Config for address");

  const client = new GraphQLClient(config.baseURI);
  const service = new SubgraphService(address, client);
  const nouns_: Noun[] = await service.getNouns();

  const nouns = nouns_.map((n) => {
    const { parts, background } = getNounData(n.seed);
    const imageUrl = getNounImageUrlFromSeed(n.seed);
    return { ...n, parts, background, imageUrl };
  });

  let noun = null;

  if (params?.["noun-id"] != null) {
    noun = nouns.find((n) => n.id === params["noun-id"]) as Noun;
    const { parts, background } = getNounData(noun.seed);
    // @ts-ignore
    noun.parts = parts;
    // @ts-ignore
    noun.background = background;
  }

  return {
    props: { address, config, noun, nouns },
    revalidate: 30,
  };
};

export async function getStaticAuctionPaths() {
  if (!config) throw new Error("No Matching Config for address");

  const client = new GraphQLClient(config.baseURI);
  const service = new SubgraphService(address, client);
  const nouns: Noun[] = await service.getNouns();
  return {
    paths: nouns.map((n) => ({ params: { "noun-id": n.id } })),
    fallback: false, // can also be true or 'blocking'
  };
}

export const getFallbackStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: true,
  };
};
