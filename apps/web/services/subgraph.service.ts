import {
  Auction,
  Bid,
  GetBidOptions,
  Noun,
  NounService,
  Delegate,
} from "./interfaces/noun.service";
import { gql, GraphQLClient } from "graphql-request";
import { Agent } from "@zoralabs/nft-metadata";
import { ALCHEMY_API_KEY } from "../utils/network";
// import { LIL_NOUN_TOKEN_ADDRESS } from "../utils/address";

const agent = new Agent({
  network: "homestead",
  networkUrl: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
  timeout: 40 * 1000,
});

const ACCOUNT_FRAGMENT = gql`
  fragment AccountFragment on Account {
    address: id
    tokenBalanceRaw
  }
`;

const BID_FRAGMENT = gql`
  fragment BidFragment on Bid {
    id
    amount
    blockNumber
    blockIndex: txIndex
    blockTimestamp
    bidder {
      ...AccountFragment
    }
  }
  ${ACCOUNT_FRAGMENT}
`;

const NOUN_FRAGMENT = gql`
  fragment NounFragment on Noun {
    id
    seed {
      background
      body
      accessory
      head
      glasses
    }
    owner {
      ...AccountFragment
    }
  }
  ${ACCOUNT_FRAGMENT}
`;

const AUCTION_FRAGMENT = gql`
  fragment AuctionFragment on Auction {
    noun {
      ...NounFragment
    }
    amount
    settled
    startTime
    endTime
    bids(
      orderBy: blockNumber
      orderDirection: desc
      orderBy: txIndex
      orderDirection: desc
    ) {
      ...BidFragment
    }
    bidder {
      ...AccountFragment
    }
  }
  ${BID_FRAGMENT}
  ${NOUN_FRAGMENT}
  ${ACCOUNT_FRAGMENT}
`;

const GET_NOUN_BY_ID = gql`
  query GetNounById($nounId: ID!) {
    noun(id: $nounId) {
      ...NounFragment
    }
  }
  ${NOUN_FRAGMENT}
`;

const GET_AUCTION_BY_ID = gql`
  query GetAuctionById($id: ID!) {
    auction(id: $id) {
      ...AuctionFragment
    }
  }
  ${AUCTION_FRAGMENT}
`;

const GET_AUCTIONS_BY_ID = gql`
  query GetAuctions($order: String, $limit: Int, $offset: Int) {
    auctions(
      orderBy: endTime
      orderDirection: $order
      first: $limit
      skip: $offset
    ) {
      ...AuctionFragment
    }
  }
  ${AUCTION_FRAGMENT}
`;

const GET_NOUNS_BY_ID = gql`
  query GetNouns {
    nouns(first: 1000) {
      ...NounFragment
    }
  }
  ${NOUN_FRAGMENT}
`;

const GET_DELEGAGES_BY_ID = gql`
  query GetDelegates {
    delegates(first: 1000, where: { delegatedVotesRaw_not: "0" }) {
      id
      nounsRepresented {
        id
      }
    }
  }
`;

const GET_BIDS = gql`
  query GetBids($address: String, $blockNumber: Int, $offset: Int!) {
    bids(
      where: { bidder: $address }
      block: { number: $blockNumber }
      skip: $offset
      orderBy: txIndex
      orderDirection: desc
    ) {
      ...BidFragment
    }
  }
  ${BID_FRAGMENT}
`;

export class SubgraphService implements NounService {
  constructor(
    private readonly address: string,
    private readonly client: GraphQLClient
  ) {}

  public async getNoun(nounId: string): Promise<Noun> {
    const resp = await this.client.request(GET_NOUN_BY_ID, {
      nounId,
    });
    return resp.noun;
  }

  public async getImageURL(nounId: string): Promise<string | undefined> {
    const resp = await agent.fetchMetadata(this.address, nounId);
    // TODO - it works but ???
    if (resp?.imageURL) {
      const imageURL = resp.imageURL;
      const encodedData = imageURL.slice(26);
      const decodedData = Buffer.from(encodedData, "base64");
      const transparentSvg = decodedData
        .toString("utf8")
        .replace('width="100%" height="100%"', 'width="0%" height="0%"');
      return (
        "data:image/svg+xml;base64," +
        Buffer.from(transparentSvg).toString("base64")
      );
    }
  }

  public async getAuction(nounId: string): Promise<Auction> {
    const resp = await this.client.request(GET_AUCTION_BY_ID, {
      id: nounId,
    });
    return resp.auction;
  }

  public async getAuctions(
    order: "DESC" | "ASC",
    limit?: number,
    offset?: number
  ): Promise<Auction[]> {
    const resp = await this.client.request(GET_AUCTIONS_BY_ID, {
      order: order.toLowerCase(),
      limit,
      offset,
    });
    return resp.auctions;
  }

  public async getNouns(): Promise<Noun[]> {
    const resp = await this.client.request(GET_NOUNS_BY_ID);
    return resp.nouns;
  }

  public async getAllDelegates(): Promise<Delegate[]> {
    const resp = await this.client.request(GET_DELEGAGES_BY_ID);
    return resp.delegates;
  }

  public async getAllAuctions(): Promise<Auction[]> {
    const resp = await this.client.request(GET_AUCTIONS_BY_ID, { limit: 1000 });
    return resp.auctions;
  }

  public async getBids(
    { address, blockNumber, offset = 0 }: GetBidOptions,
    bids: Bid[] = []
  ): Promise<Bid[]> {
    const resp = await this.client.request(GET_BIDS, {
      address,
      offset,
      ...(blockNumber && {
        blockNumber:
          typeof blockNumber === "string"
            ? parseInt(blockNumber, 10)
            : blockNumber,
      }),
    });

    bids = [...bids, ...resp.bids];

    // If bids page is max length recurse to get more bids
    // TODO - cache better because shoutout POAP.ETH
    if (resp.bids.length !== 100) {
      return bids;
    } else {
      return this.getBids({ address, blockNumber, offset: offset + 100 }, bids);
    }
  }
}
