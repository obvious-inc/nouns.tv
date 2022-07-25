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
  const { ensName, avatarURI } = useProfile(bid.bidderAddress, bid.blockNumber);

  return (
    <a
      href={getEtherscanLink(EtherscanPageType.ADDRESS, bid.bidderAddress)}
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
              marginRight: "0.5em",
              background: "rgb(0 0 0 / 10%)",
            }}
          >
            <img src={avatarURI} alt="Avatar" width={36} height={36} />
          </div>
        )}
        <div style={{ fontSize: "1.1em" }}>
          <div
            style={{
              fontWeight: "600",
              // color: "#AE3208"
            }}
          >
            {"Ξ"} {toFixed(formatEther(bid.amount), 2)}
          </div>
          <div data-address style={{ fontWeight: "400" }}>
            {ensName || shortenAddress(bid.bidderAddress)}
          </div>
        </div>
      </Box>
    </a>
  );
};

export function Banner({ bids }: { bids: Bid[] }) {
  return (
    <Marquee className={MarqueeRoot} pauseOnHover gradient={false} speed={60}>
      <div style={{ padding: "0.6em 0", minHeight: "5.7rem" }}>
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
                      margin: "0 1.5em",
                      width: "1px",
                      height: "2.2em",
                      background: "rgb(0 0 0 / 25%)",
                    }}
                  />
                ) : (
                  <div style={{ width: "25vw" }} />
                )}
              </React.Fragment>
            ))}
        </Box>
      </div>
    </Marquee>
  );
}
