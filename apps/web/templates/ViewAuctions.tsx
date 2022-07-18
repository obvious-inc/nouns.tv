import React from "react";
import { Auction } from "../services/interfaces/noun.service";
// import { useInView } from "react-intersection-observer";
// import { ContractSwitcher } from "../compositions/ContractSwitcher";
import { AuctionPage } from "../components/AuctionPage";
// import { Box } from "degen";
// import { Text } from "../elements/Text";
// import { Banner } from "../components/Banner";
// import { PAGE_SIZE } from "../utils/pagination";

export function ViewAuctionsTemplate({ auction }: { auction: Auction }) {
  // const { ref } = useInView({
  //   threshold: 0.15,
  //   delay: 100,
  //   onChange: (inView: boolean) => inView && !isValidating && setSize(size + 1),
  // });

  // const isLoadingInitialData = !data && !error;
  // const isLoadingMore = useMemo(
  //   () =>
  //     isLoadingInitialData ||
  //     (size > 0 && data && typeof data[size - 1] === "undefined"),
  //   [data, isLoadingInitialData, size]
  // );
  // const isEmpty = useMemo(() => data?.[0]?.length === 0, [data]);
  // const isReachingEnd = useMemo(
  //   () => isEmpty || (data && data[data.length - 1]?.length < PAGE_SIZE),
  //   [data, isEmpty]
  // );
  // const isRefreshing = useMemo(
  //   () => isValidating && data?.length === size,
  //   [data?.length, isValidating, size]
  // );

  // if (auction == null) return null;

  return <AuctionPage auction={auction} />;
}
