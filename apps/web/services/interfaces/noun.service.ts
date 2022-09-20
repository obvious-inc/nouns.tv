export type Account = {
  address: string;
  tokenBalanceRaw: string;
};

export type Bid = {
  id: string;
  bidder: Account;
  blockNumber: number;
  blockIndex: number;
  blockTimestamp: number;
  amount: string;
};

export type Seed = {
  background: number;
  body: number;
  accessory: number;
  head: number;
  glasses: number;
};

export type Noun = {
  id: string;
  owner: Account;
  seed: Seed;
};

export type Auction = {
  settled: boolean;
  amount: string;
  startTime: number;
  endTime: number;
  noun: Noun;
  bids: Bid[];
  bidder?: Account;
};

export type Delegate = {
  id: string;
  nounsRepresented: { id: string }[];
};

export type GetBidOptions = {
  address?: string;
  blockNumber?: number | string;
  offset?: number;
};

/*
 * NounsService
 * Reusable service interface to allow multiple backend
 * as more nounsapi's are build without massive refactor
 */
export interface NounService {
  getNoun(nounId: string): Promise<Noun>;
  getAuction(nounId: string): Promise<Auction>;
  getAuctions(
    order: "DESC" | "ASC",
    limit: number,
    offset: number
  ): Promise<Auction[]>;
  getBids(opts: GetBidOptions): Promise<Bid[]>;
  getImageURL(nounId: string): Promise<string | undefined>;
}
