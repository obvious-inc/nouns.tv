import { Box, vars, Avatar } from "degen";
import { BidTable } from "./bid/BidTable";
import { Auction } from "../services/interfaces/noun.service";
import {
  AuctionRowRoot,
  AuctionMetaContainer,
  NounImage,
  NounTitle,
  NounTitleArrow,
  NounTitleContainer,
  AuctionRowLabel,
} from "./AuctionRow.css";
import { useNoun } from "../hooks/useNoun";
import { useProfile } from "../hooks/useProfile";
import { format, fromUnixTime, isPast } from "date-fns";
import { Text } from "../elements/Text";
import { useAuction } from "../hooks/useAuction";
import { ArrowUpRight } from "react-feather";
import { useServiceContext } from "../hooks/useServiceContext";
import { useMemo } from "react";
import { EtherscanPageType, getEtherscanLink } from "../utils/url";
import { toFixed } from "../utils/numbers";
import { NOUN_TOKEN_ADDRESS, shortenAddress } from "../utils/address";
import { CountdownDisplay } from "./CountdownDisplay";
import { Banner } from "./Banner";
import { formatEther } from "ethers/lib/utils";

type AuctionRowProps = {
  auction: Auction;
};

export function AuctionRow({ auction: initialAuction }: AuctionRowProps) {
  const { config } = useServiceContext();
  const { auction = initialAuction } = useAuction(initialAuction.noun.id, {
    fallbackData: initialAuction,
    ...(!initialAuction.settled && {
      refreshInterval: 1000 * 30,
    }),
  });

  const { noun, imageURL } = useNoun(auction.noun.id, {
    fallbackData: auction.noun,
  });
  const { ensName: ownerENSName, avatarURI: ownerAvatarURI } = useProfile(
    noun.owner.address
  );
  const { ensName: bidderENSName } = useProfile(auction.bidder?.address);

  const isEnded = useMemo(
    () => isPast(fromUnixTime(auction.endTime)),
    [auction]
  );

  return (
    <Box
      style={{
        height: "100%",
        display: "flex",
        alignItems: "stretch",
        background: "rgb(25 25 25)",
      }}
    >
      <div
        style={{
          flex: 2,
          minWidth: 0,
          borderRight: "0.3rem solid rgb(241, 206, 24)",
        }}
      >
        <Box
          className={AuctionRowRoot}
          style={{ padding: "4rem 0 0", minHeight: "70vh" }}
        >
          <Box
            as="a"
            href={`${config.externalBaseURI}/${auction.noun.id}`}
            target="_blank"
            rel="noreferrer"
            // className={NounTitleContainer}
          >
            <Box
              as="img"
              // className={NounImage}
              style={{ display: "block", width: "100%" }}
              src={imageURL || "../assets/loading-skull-noun.gif"}
              alt={`Noun ${auction.noun.id}`}
            />
          </Box>
          <Box style={{ padding: "0 2rem 2rem 0" }}>
            <Text
              variant="extraLarge"
              className={NounTitle}
              color={auction.settled ? "text" : "yellow"}
              transform="uppercase"
            >
              {config.name} {auction.noun.id}
              <ArrowUpRight
                className={NounTitleArrow}
                color={vars.colors.yellow}
              />
            </Text>
            <Box className={AuctionMetaContainer}>
              <Box>
                {/* <Text className={AuctionRowLabel} variant="label"> */}
                {/*   {format(fromUnixTime(auction.startTime), "MMMM dd, yy")} */}
                {/* </Text> */}
                <Text className={AuctionRowLabel} variant="label">
                  {auction.settled
                    ? "Winning bid"
                    : auction.bidder
                    ? isEnded
                      ? "Winning bid"
                      : "Current bid"
                    : "Reserve Not met"}
                </Text>
                <Text
                  variant={auction.settled ? "medium" : "large"}
                  color={auction.settled ? "text" : "yellow"}
                  marginBottom="1"
                >
                  ETH {toFixed(formatEther(auction.amount), 2)}
                </Text>
                <a
                  href={getEtherscanLink(
                    EtherscanPageType.ADDRESS,
                    auction.settled
                      ? ownerENSName || noun.owner.address
                      : auction.bidder
                      ? bidderENSName || auction.bidder.address
                      : undefined
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Text
                    color="textSecondary"
                    weight="medium"
                    transform={
                      bidderENSName || ownerENSName ? "uppercase" : undefined
                    }
                  >
                    {auction.settled
                      ? ownerENSName || shortenAddress(noun.owner.address)
                      : auction?.bidder
                      ? bidderENSName || shortenAddress(auction.bidder.address)
                      : "NO BIDS YET"}
                  </Text>
                </a>
              </Box>
              <Box>
                <Text className={AuctionRowLabel} variant="label">
                  {auction.settled
                    ? "Holder"
                    : isEnded
                    ? "Auction Ended"
                    : "Time Remaining"}
                </Text>
                {!auction.settled && (
                  <>
                    <Text
                      variant="large"
                      transform="uppercase"
                      marginBottom="1"
                      color={isEnded ? "textTertiary" : "text"}
                    >
                      <CountdownDisplay to={auction.endTime} />
                    </Text>
                    <Text
                      transform="uppercase"
                      color="textSecondary"
                      weight="medium"
                    >
                      {format(fromUnixTime(auction.endTime), "PP h:mm a")}
                    </Text>
                  </>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
        <Banner />
        {/* <BidTable bids={auction.bids} /> */}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <iframe
          src="https://app.newshades.xyz/c/62c81262ceb3b1d36c1bd457"
          style={{ display: "block", width: "100%", height: "100%", border: 0 }}
        />
      </div>
    </Box>
  );
}
