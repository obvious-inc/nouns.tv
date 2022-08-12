import React from "react";
import { BigNumber, utils as ethersUtils } from "ethers";
import {
  useContract,
  useProvider,
  usePrepareContractWrite,
  useContractWrite,
  useContractReads,
  useWaitForTransaction,
} from "wagmi";
import { NounsAuctionHouseABI, NounsTokenABI } from "@nouns/contracts";
import { getNounData, ImageData } from "@nouns/assets";
import { buildSVG, getContractAddressesForChainOrThrow } from "@nouns/sdk";
import { chains } from "../utils/network";

const contractAddresses = getContractAddressesForChainOrThrow(chains[0].id);

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

const useFomo = (auction) => {
  const provider = useProvider();

  const [isFomo, setIsFomo] = React.useState(false);
  const [isVotingActive, setVotingActive] = React.useState(false);

  React.useEffect(() => {
    if (auction == null || auction.settled) return;

    const update = () => {
      const nowMillis = parseInt(new Date().getTime() / 1000);
      const isFomo = auction.endTime < nowMillis;
      setIsFomo(isFomo);

      if (isFomo) {
        setVotingActive(true);
        window.setTimeout(() => {
          setVotingActive(false);
        }, 6000);
      }
    };

    provider.on("block", update);
    return () => {
      provider.off("block", update);
    };
  }, [provider, auction]);

  return { isFomo, isVotingActive };
};

const useActiveBlock = () => {
  const provider = useProvider();

  const numberRef = React.useRef();

  const [number, setNumber] = React.useState(null);
  const [block, setBlock] = React.useState(null);

  React.useEffect(() => {
    provider.getBlock("latest").then((b_) => {
      const b = { ...b_, localTimestamp: parseInt(new Date() / 1000) };
      setNumber(b.number);
      setBlock(b);
    });

    const blockHandler = (n) => {
      if (numberRef.current > n) return;
      setNumber(n);
      provider.getBlock(n).then((b_) => {
        const b = { ...b_, localTimestamp: parseInt(new Date() / 1000) };
        setBlock(b);
      });
    };

    provider.on("block", blockHandler);

    return () => {
      provider.off("block", blockHandler);
    };
  }, [provider]);

  return block != null && block.number === number ? block : { number };
};

const useSimpleContractWrite = ({ onSuccess, ...options }) => {
  const { config, error: prepareError } = usePrepareContractWrite(options);

  const {
    data: transactionResponse,
    writeAsync,
    isLoading: isLoadingTransactionResponse,
    error: callError,
  } = useContractWrite(config);
  const { isLoading: isLoadingTransactionReceipt } = useWaitForTransaction({
    hash: transactionResponse?.hash,
    onSuccess: (receipt) => {
      if (onSuccess) onSuccess(receipt);
    },
  });

  return {
    call: writeAsync,
    error: callError ?? prepareError,
    prepareError,
    callError,
    isLoadingTransactionResponse,
    isLoadingTransactionReceipt,
    isLoading: isLoadingTransactionResponse || isLoadingTransactionReceipt,
  };
};

const useBidding = (nounId, { reservePrice }) => {
  const [amount, setAmount] = React.useState(reservePrice ?? "");

  const {
    call,
    error,
    isLoading,
    isLoadingTransactionResponse,
    isLoadingTransactionReceipt,
  } = useSimpleContractWrite({
    addressOrName: contractAddresses.nounsAuctionHouseProxy,
    contractInterface: NounsAuctionHouseABI,
    functionName: "createBid",
    args: [nounId],
    enabled:
      nounId != null && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0,
    overrides: {
      value: isNaN(parseFloat(amount))
        ? null
        : ethersUtils.parseEther(parseFloat(amount).toString()),
    },
    onSuccess: (receipt) => {
      console.log("success", receipt.status, typeof receipt.status);
      // Clear amount if bid was successful
      if (receipt.status === 1) setAmount("");
    },
  });

  React.useEffect(() => {
    setAmount(reservePrice ?? "");
  }, [nounId, reservePrice]);

  return {
    bid: call,
    error,
    isLoading,
    isLoadingTransactionResponse,
    isLoadingTransactionReceipt,
    amount,
    setAmount,
  };
};

const useSettling = ({ enabled }) => {
  const {
    call,
    error,
    isLoading,
    isLoadingTransactionResponse,
    isLoadingTransactionReceipt,
  } = useSimpleContractWrite({
    addressOrName: contractAddresses.nounsAuctionHouseProxy,
    contractInterface: NounsAuctionHouseABI,
    functionName: "settleCurrentAndCreateNewAuction",
    enabled,
  });

  return {
    settle: call,
    error,
    isLoading,
    isLoadingTransactionResponse,
    isLoadingTransactionReceipt,
  };
};

const auctionHouseContractConfig = {
  addressOrName: contractAddresses.nounsAuctionHouseProxy,
  contractInterface: NounsAuctionHouseABI,
};

export const useAuction = () => {
  const provider = useProvider();

  const [activeNounId, setActiveNounId] = React.useState(null);
  const [auctionsByNounId, setAuctionsByNounId] = React.useState({});
  const [seedsByNounId, setSeedsByNounId] = React.useState({});
  const [bids, setBids] = React.useState([]);

  const [auctionEnded, setAuctionEnded] = React.useState(false);

  const auctionHouseContract = useContract({
    ...auctionHouseContractConfig,
    signerOrProvider: provider,
  });

  const tokenContract = useContract({
    addressOrName: contractAddresses.nounsToken,
    contractInterface: NounsTokenABI,
    signerOrProvider: provider,
  });

  const { data: auctionData } = useContractReads({
    contracts: ["reservePrice", "minBidIncrementPercentage"].map(
      (functionName) => ({
        ...auctionHouseContractConfig,
        functionName,
      })
    ),
  });
  const [reservePrice, minBidIncrementPercentage] = auctionData ?? [];

  const auction = React.useMemo(() => {
    if (activeNounId == null) return null;

    const auction = auctionsByNounId[activeNounId];
    const seed = seedsByNounId[auction.nounId];

    if (auction == null || seed == null) return null;

    const { parts, background } = getNounData(seed);

    const getImageUrl = () => {
      try {
        const svgBinary = buildSVG(parts, ImageData.palette, background);
        return `data:image/svg+xml;base64,${btoa(svgBinary)}`;
      } catch (e) {
        console.error(e);
        return null;
      }
    };

    const noun = {
      id: auction.nounId,
      ownerAddress: auction.winnerAddess,
      parts,
      background,
      imageUrl: getImageUrl(),
    };

    return {
      ...auction,
      reservePrice,
      minBidIncrementPercentage,
      noun,
      bids: bids
        .filter((b) => b.nounId === auction.nounId)
        .sort((b1, b2) => {
          if (b2.blockNumber - b1.blockNumber === 0)
            return b2.transactionIndex - b1.transactionIndex;
          return b2.blockNumber - b1.blockNumber;
        }),
    };
  }, [
    activeNounId,
    auctionsByNounId,
    seedsByNounId,
    bids,
    reservePrice,
    minBidIncrementPercentage,
  ]);

  const { isFomo, isVotingActive } = useFomo(auction);
  const activeBlock = useActiveBlock();

  const bidding = useBidding(auction?.noun.id, {
    reservePrice: reservePrice?.toString(),
  });
  const settling = useSettling({ enabled: auctionEnded });

  React.useEffect(() => {
    const fetchBids = () =>
      auctionHouseContract
        .queryFilter(auctionHouseContract.filters.AuctionBid(), 0 - 6500)
        .then((bids) => {
          setBids(bids.map(parseBid));
        });

    fetchBids();

    window.addEventListener("focus", fetchBids);
    return () => {
      window.removeEventListener("focus", fetchBids);
    };
  }, [auctionHouseContract]);

  React.useEffect(() => {
    if (activeNounId == null) return;
    tokenContract.seeds(activeNounId).then((seed) => {
      setSeedsByNounId((ss) => ({ ...ss, [activeNounId]: seed }));
    });
  }, [tokenContract, activeNounId]);

  React.useEffect(() => {
    const c = auctionHouseContract;

    const fetchAuction = () =>
      c.auction().then((a) => {
        const auction = parseAuction(a);
        setActiveNounId(auction.nounId);
        setAuctionsByNounId((as) => ({ ...as, [auction.nounId]: auction }));
      });

    c.on(c.filters.AuctionBid(), (nounId_, sender, value, extended, event) => {
      const nounId = parseInt(nounId_);
      console.log("auction bid", { nounId, sender, value, event });
      setAuctionsByNounId((as) => ({
        ...as,
        [nounId]: { ...as[nounId], bidderAddress: sender, amount: value },
      }));
      setBids((bs) => {
        if (
          bs.some(
            (b) =>
              b.blockNumber === event.blockNumber &&
              b.transactionIndex === event.transactionIndex
          )
        )
          return bs;
        return [
          ...bs,
          parseBid({
            ...event,
            args: { nounId: nounId_, sender, value, extended },
          }),
        ];
      });
    });
    c.on(c.filters.AuctionCreated(), (nounId_, startTime, endTime) => {
      const nounId = parseInt(nounId_);
      console.log("auction created", nounId);
      setActiveNounId(nounId);
      setAuctionsByNounId((as) => ({
        ...as,
        [nounId]: {
          settled: false,
          bidderAddress: "0x".padEnd(42, "0"),
          amount: BigNumber.from(0),
          ...as[nounId],
          nounId,
          startTime: parseInt(startTime),
          endTime: parseInt(endTime),
        },
      }));
    });
    c.on(c.filters.AuctionExtended(), (nounId_, endTime) => {
      const nounId = parseInt(nounId_);
      console.log("auction extended", nounId);
      setAuctionsByNounId((as) => ({
        ...as,
        [nounId]: { ...as[nounId], endTime: parseInt(endTime) },
      }));
    });
    c.on(c.filters.AuctionSettled(), (nounId_, winner, amount) => {
      const nounId = parseInt(nounId_);
      console.log("auction settled", nounId);
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

    window.addEventListener("focus", fetchAuction);
    fetchAuction();

    return () => {
      c.removeAllListeners();
      window.removeEventListener("focus", fetchAuction);
    };
  }, [auctionHouseContract]);

  React.useEffect(() => {
    if (auction?.endTime == null) return;

    if (auction.endTime < new Date().getTime() / 1000) {
      setAuctionEnded(true);
      return;
    }

    const handle = window.setInterval(() => {
      const didEnd = auction.endTime < new Date().getTime() / 1000;
      if (didEnd) window.clearInterval(handle);
      setAuctionEnded(didEnd);
    }, 1000);
    return () => {
      window.clearInterval(handle);
    };
  }, [auction?.endTime]);

  return {
    auction,
    auctionEnded,
    fomo: { isFomo, isVotingActive },
    activeBlock,
    bidding,
    settling,
  };
};
