import React from "react";
import { useContract, useProvider } from "wagmi";
import { NounsAuctionHouseABI, NounsTokenABI } from "@nouns/contracts";
import { getNounData, ImageData } from "@nouns/assets";
import { buildSVG, getContractAddressesForChainOrThrow } from "@nouns/sdk";

const contractAddresses = getContractAddressesForChainOrThrow(1);

const parseAuction = (auction) => ({
  nounId: parseInt(auction.nounId),
  amount: auction.amount,
  bidderAddress: auction.bidder,
  startTime: parseInt(auction.startTime),
  endTime: parseInt(auction.endTime),
  settled: auction.settled,
});

const parseBid = (bid) => ({
  id: `${bid.blockNumber}-${bid.transactionIndex}`,
  blockNumber: bid.blockNumber,
  transactionIndex: bid.transactionIndex,
  nounId: parseInt(bid.args.nounId),
  bidderAddress: bid.args.sender,
  amount: bid.args.value,
});

export const useAuction = () => {
  const provider = useProvider();

  const [activeNounId, setActiveNounId] = React.useState(null);
  const [auctionsByNounId, setAuctionsByNounId] = React.useState({});
  const [seedsByNounId, setSeedsByNounId] = React.useState({});
  const [bids, setBids] = React.useState([]);

  const auctionHouseContract = useContract({
    addressOrName: contractAddresses.nounsAuctionHouseProxy,
    contractInterface: NounsAuctionHouseABI,
    signerOrProvider: provider,
  });

  const tokenContract = useContract({
    addressOrName: contractAddresses.nounsToken,
    contractInterface: NounsTokenABI,
    signerOrProvider: provider,
  });

  React.useEffect(() => {
    auctionHouseContract
      .queryFilter(auctionHouseContract.filters.AuctionBid(), 0 - 6500)
      .then((bids) => {
        setBids(bids.map(parseBid));
      });
  }, [auctionHouseContract]);

  React.useEffect(() => {
    if (activeNounId == null) return;
    tokenContract.seeds(activeNounId).then((seed) => {
      setSeedsByNounId((ss) => ({ ...ss, [activeNounId]: seed }));
    });
  }, [tokenContract, activeNounId]);

  React.useEffect(() => {
    const c = auctionHouseContract;

    c.auction().then((a) => {
      const auction = parseAuction(a);
      setActiveNounId(auction.nounId);
      setAuctionsByNounId((as) => ({ ...as, [auction.nounId]: auction }));
    });

    c.on(c.filters.AuctionBid(), (nounId, sender, value, extended, event) => {
      setBids((bs) => [
        ...bs,
        parseBid({ ...event, args: { nounId, sender, value, extended } }),
      ]);
    });
    c.on(c.filters.AuctionCreated(), (nounId_, startTime, endTime) => {
      const nounId = parseInt(nounId_);
      setActiveNounId(nounId);
      setAuctionsByNounId((as) => ({
        ...as,
        [nounId]: {
          nounId,
          startTime: parseInt(startTime),
          endTime: parseInt(endTime),
        },
      }));
    });
    c.on(c.filters.AuctionExtended(), (nounId_, endTime) => {
      const nounId = parseInt(nounId_);
      setAuctionsByNounId((as) => ({
        ...as,
        [nounId]: { ...as[nounId], endTime: parseInt(endTime) },
      }));
    });
    c.on(c.filters.AuctionSettled(), (nounId_, winner, amount) => {
      const nounId = parseInt(nounId_);
      setAuctionsByNounId((as) => ({
        ...as,
        [nounId]: {
          ...as[nounId],
          amount,
          settled: true,
          winnerAddess: winner,
        },
      }));
    });

    return () => {
      c.removeAllListeners();
    };
  }, [auctionHouseContract]);

  const auction = React.useMemo(() => {
    if (activeNounId == null) return null;

    const auction = auctionsByNounId[activeNounId];
    const seed = seedsByNounId[auction.nounId];

    if (auction == null || seed == null) return null;

    const { parts, background } = getNounData(seed);

    const svgBinary = buildSVG(parts, ImageData.palette, background);
    const imageUrl = `data:image/svg+xml;base64,${btoa(svgBinary)}`;

    const noun = {
      id: auction.nounId,
      ownerAddress: auction.winnerAddess,
      parts,
      background,
      imageUrl,
    };

    return {
      ...auction,
      noun,
      bids: bids
        .filter((b) => b.nounId === auction.nounId)
        .sort((b1, b2) => {
          if (b2.blockNumber - b1.blockNumber === 0)
            return b2.transactionIndex - b1.transactionIndex;
          return b2.blockNumber - b1.blockNumber;
        }),
    };
  }, [activeNounId, auctionsByNounId, seedsByNounId, bids]);

  return { data: auction };
};
