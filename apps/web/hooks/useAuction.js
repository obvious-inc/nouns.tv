import React from "react";
import { useRouter } from "next/router";
import { utils as ethersUtils } from "ethers";
import {
  useContract,
  useProvider,
  usePrepareContractWrite,
  useContractWrite,
  useContractReads,
  useContractRead,
  useContractEvent,
  useWaitForTransaction,
  useNetwork,
} from "wagmi";
import { NounsAuctionHouseABI, NounsTokenABI } from "@nouns/contracts";
import { getNounData } from "@nouns/assets";
import { getContractAddressesForChainOrThrow } from "@nouns/sdk";
import useFomo from "../hooks/useFomo";
import { chains } from "../utils/network";
import { getImageUrlFromSeed as getNounImageUrl } from "../utils/nouns";

const useDidMount = () => {
  const [didMount, setDidMount] = React.useState(false);
  React.useEffect(() => {
    setDidMount(true);
  }, []);
  return didMount;
};

const useContractAddresses = () => {
  const { chain } = useNetwork();
  return getContractAddressesForChainOrThrow(chain?.id ?? chains[1]?.id ?? 1);
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

const useBidding = (nounId) => {
  const [amount, setAmount] = React.useState("");

  const contractAddresses = useContractAddresses();

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
      // Clear amount if bid was successful
      if (receipt.status === 1) setAmount("");
    },
  });

  React.useEffect(() => {
    setAmount("");
  }, [nounId]);

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
  const contractAddresses = useContractAddresses();

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

const useAuctionMeta = () => {
  const contractAddresses = useContractAddresses();

  const { data: auctionData } = useContractReads({
    contracts: ["reservePrice", "minBidIncrementPercentage"].map(
      (functionName) => ({
        addressOrName: contractAddresses.nounsAuctionHouseProxy,
        contractInterface: NounsAuctionHouseABI,
        functionName,
      })
    ),
  });
  const [reservePrice, minBidIncrementPercentage] = auctionData ?? [];
  return { reservePrice, minBidIncrementPercentage };
};

const useAuctionBids = () => {
  const contractAddresses = useContractAddresses();
  const provider = useProvider();

  const [bids, setBids] = React.useState([]);

  const auctionHouseContract = useContract({
    addressOrName: contractAddresses.nounsAuctionHouseProxy,
    contractInterface: NounsAuctionHouseABI,
    signerOrProvider: provider,
  });

  const parseBid = React.useCallback(
    (bid) => ({
      id: `${bid.blockNumber}-${bid.transactionIndex}`,
      blockNumber: bid.blockNumber,
      transactionIndex: bid.transactionIndex,
      nounId: parseInt(bid.args.nounId),
      bidderAddress: bid.args.sender,
      amount: bid.args.value,
    }),
    []
  );

  useContractEvent({
    addressOrName: contractAddresses.nounsAuctionHouseProxy,
    contractInterface: NounsAuctionHouseABI,
    eventName: "AuctionBid",
    listener: ([nounId, sender, value, extended, event]) => {
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
            args: { nounId, sender, value, extended },
          }),
        ];
      });
    },
  });

  React.useEffect(() => {
    const fetchBids = () =>
      auctionHouseContract
        .queryFilter(auctionHouseContract.filters.AuctionBid(), 0 - 6500)
        .then((bids) => {
          setBids(bids.map(parseBid));
        });

    fetchBids();

    window.addEventListener("focus", fetchBids);
    window.addEventListener("online", fetchBids);
    return () => {
      window.removeEventListener("focus", fetchBids);
      window.removeEventListener("online", fetchBids);
    };
  }, [auctionHouseContract, parseBid]);

  return bids;
};

export const useAuction = () => {
  const didMount = useDidMount();
  const bids = useAuctionBids();

  const [auctionEnded, setAuctionEnded] = React.useState(false);

  const contractAddresses = useContractAddresses();

  const { data: rawAuction, refetch: refetchAuction } = useContractRead({
    cacheTime: 0, // Prevent flash of old auction on page load
    addressOrName: contractAddresses.nounsAuctionHouseProxy,
    contractInterface: NounsAuctionHouseABI,
    functionName: "auction",
    select: (auction) => ({
      nounId: parseInt(auction.nounId),
      amount: auction.amount,
      bidderAddress: auction.bidder,
      startTime: parseInt(auction.startTime),
      endTime: parseInt(auction.endTime),
      settled: auction.settled,
    }),
  });

  const { data: seed } = useContractRead({
    addressOrName: contractAddresses.nounsToken,
    contractInterface: NounsTokenABI,
    functionName: "seeds",
    args: [rawAuction?.nounId],
    enabled: rawAuction != null,
  });

  useContractEvent({
    addressOrName: contractAddresses.nounsAuctionHouseProxy,
    contractInterface: NounsAuctionHouseABI,
    eventName: "AuctionCreated",
    listener: () => refetchAuction(),
  });
  useContractEvent({
    addressOrName: contractAddresses.nounsAuctionHouseProxy,
    contractInterface: NounsAuctionHouseABI,
    eventName: "AuctionSettled",
    listener: () => refetchAuction(),
  });
  useContractEvent({
    addressOrName: contractAddresses.nounsAuctionHouseProxy,
    contractInterface: NounsAuctionHouseABI,
    eventName: "AuctionExtended",
    listener: () => refetchAuction(),
  });
  useContractEvent({
    addressOrName: contractAddresses.nounsAuctionHouseProxy,
    contractInterface: NounsAuctionHouseABI,
    eventName: "AuctionBid",
    listener: () => refetchAuction(),
  });

  const { reservePrice, minBidIncrementPercentage } = useAuctionMeta();

  const auction = React.useMemo(() => {
    if (rawAuction == null || seed == null) return null;

    const { parts, background } = getNounData(seed);

    const noun = {
      id: rawAuction.nounId,
      ownerAddress: rawAuction.winnerAddess,
      parts,
      background,
      imageUrl: getNounImageUrl({ parts, background }),
    };

    return {
      ...rawAuction,
      reservePrice,
      minBidIncrementPercentage,
      noun,
      bids: bids
        .filter((b) => b.nounId === rawAuction.nounId)
        .sort((b1, b2) => {
          if (b2.blockNumber - b1.blockNumber === 0)
            return b2.transactionIndex - b1.transactionIndex;
          return b2.blockNumber - b1.blockNumber;
        }),
    };
  }, [rawAuction, seed, bids, reservePrice, minBidIncrementPercentage]);

  const router = useRouter();

  const fomo = useFomo({
    auction,
    enabled: Boolean(router?.query.fomo) || (auctionEnded && !auction?.settled),
  });
  const bidding = useBidding(auction?.noun.id);
  const settling = useSettling({ enabled: auctionEnded });

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
    auction: didMount ? auction : null,
    auctionEnded,
    fomo,
    bidding,
    settling,
  };
};
