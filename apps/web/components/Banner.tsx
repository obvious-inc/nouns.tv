import React from "react";
import Image from "next/image";
import Marquee from "react-fast-marquee";
import { Bid } from "../services/interfaces/noun.service";
import { useProfile } from "../hooks/useProfile";
import { EtherscanPageType, getEtherscanLink } from "../utils/url";
import { Box } from "degen";
import { toFixed } from "../utils/numbers";
import { formatEther } from "ethers/lib/utils";
import { Text } from "../elements/Text";
import { shortenAddress } from "../utils/address";
import { MarqueeRoot } from "./Banner.css";

const BidBlock = ({ bid }: { bid: Bid }) => {
  const { ensName, avatarURI } = useProfile(
    bid.bidder.address,
    bid.blockNumber
  );

  return (
    <a
      href={getEtherscanLink(EtherscanPageType.ADDRESS, bid.bidder.address)}
      target="_blank"
      rel="noreferrer"
      style={{ display: "block" }}
    >
      <Box display="flex" flexDirection="row" alignItems="center">
        {avatarURI && (
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              overflow: "hidden",
              marginRight: "0.5rem",
            }}
          >
            <Image src={avatarURI} alt="Avatar" width={36} height={36} />
          </div>
        )}
        <Box display="flex" flexDirection="column">
          <Text font="mono" transform="uppercase" weight="medium">
            <span style={{ color: "#AE3208" }}>
              ETH {toFixed(formatEther(bid.amount), 2)}
            </span>
          </Text>
          <Text
            font="mono"
            weight="medium"
            transform={ensName ? "uppercase" : undefined}
            underline="hover"
          >
            {ensName || shortenAddress(bid.bidder.address)}
          </Text>
        </Box>
      </Box>
    </a>
  );
};

export function Banner({ bids }: { bids: Bid[] }) {
  return (
    <Marquee className={MarqueeRoot} pauseOnHover gradient={false} speed={60}>
      <div style={{ padding: "0.5rem 0" }}>
        <Box display="flex" flexDirection="row" alignItems="center">
          {bids
            .sort((a, b) => b.blockTimestamp - a.blockTimestamp)
            .map((bid, i, bids) => (
              <React.Fragment key={i}>
                <BidBlock bid={bid} />
                {i !== bids.length - 1 ? (
                  <div
                    key={i}
                    style={{
                      margin: "0 1.35rem",
                      width: "1px",
                      height: "2rem",
                      background: "#AE3208",
                    }}
                  />
                ) : (
                  <div style={{ width: "5.4rem" }} />
                )}
              </React.Fragment>
            ))}
        </Box>
      </div>
    </Marquee>
  );
}
