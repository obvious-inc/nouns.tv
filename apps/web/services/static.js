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

  const auctions_ = await service.getAuctions("ASC", 1000);
  const auctionsByNounId = auctions_.reduce((acc, { noun, ...a }) => {
    acc[noun.id] = a;
    return acc;
  }, {});

  const nouns = await service.getNouns();
  const nounsById = nouns.reduce((acc, n) => {
    if (n.id <= 1820 && n.id % 10 === 0) {
      const auction = auctionsByNounId[Number(n.id) + 1];
      acc[n.id] = { ...n, bornTime: auction.startTime };
    } else {
      const auction = auctionsByNounId[n.id];
      acc[n.id] = { ...n, auction, bornTime: auction.startTime };
    }
    return acc;
  }, {});

  let noun = null;

  if (params?.["noun-id"] != null) {
    noun = nounsById[params["noun-id"]];
  }

  return {
    props: {
      address,
      config,
      noun,
      nounsById,
    },
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
    fallback: "blocking", // can also be true or 'blocking'
  };
}

export const getFallbackStaticPaths = async () => {
  return {
    paths: [],
    fallback: true,
  };
};
