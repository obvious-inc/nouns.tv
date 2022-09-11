import { getNounData } from "@nouns/assets";
import { getImageUrlFromSeed as getNounImageUrlFromSeed } from "../utils/nouns";
import { NOUN_TOKEN_ADDRESS } from "../utils/address";
import { configLookup } from "./ServiceContext";
import { GraphQLClient } from "graphql-request";
import { SubgraphService } from "./subgraph.service";

const address = NOUN_TOKEN_ADDRESS;
const config = configLookup(address);

export const getStaticAuctionProps = async ({ params }) => {
  if (!config) throw new Error("No Matching Config for address");

  const client = new GraphQLClient(config.baseURI);
  const service = new SubgraphService(address, client);
  const nouns_ = await service.getNouns();

  const nouns = nouns_.map((n) => {
    const { parts, background } = getNounData(n.seed);
    const imageUrl = getNounImageUrlFromSeed(n.seed);
    return { ...n, parts, background, imageUrl };
  });

  let noun = null;

  if (params?.["noun-id"] != null) {
    noun = nouns.find((n) => n.id === params["noun-id"]);
    const { parts, background } = getNounData(noun.seed);
    noun.parts = parts;
    noun.background = background;
    noun.auction = (await service.getAuction(noun.id)) ?? null;
    delete noun.auction?.noun;
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
  const nouns = await service.getNouns();
  return {
    paths: nouns.map((n) => ({ params: { "noun-id": n.id } })),
    fallback: false, // can also be true or 'blocking'
  };
}

export const getFallbackStaticPaths = async () => {
  return {
    paths: [],
    fallback: true,
  };
};
