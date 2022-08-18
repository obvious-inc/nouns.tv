import React from "react";
import { css } from "@emotion/react";
import Marquee from "react-fast-marquee";
import { useProfile } from "../hooks/useProfile";
import { EtherscanPageType, getEtherscanLink } from "../utils/url";
import { Box } from "degen";
import { formatEther } from "ethers/lib/utils";
import { shortenAddress } from "../utils/address";
import { MarqueeRoot } from "./Banner.css";

const BidBlock = ({ bid }) => {
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
              fontWeight: "700",
              // color: "#AE3208"
            }}
          >
            {"Ξ"} {formatEther(bid.amount)}
          </div>
          <div data-address style={{ fontWeight: "400" }}>
            {ensName || shortenAddress(bid.bidderAddress)}
          </div>
        </div>
      </Box>
    </a>
  );
};

export function Banner({ bids }) {
  return (
    <Marquee className={MarqueeRoot} pauseOnHover gradient={false} speed={60}>
      <div
        style={{
          padding: "0.6em 0",
          minHeight: "5.7rem",
          display: "flex",
          alignItems: "center",
        }}
      >
        {bids.length === 0 ? (
          <div
            css={css({
              height: "100%",
              display: "flex",
              alignItems: "center",
            })}
          >
            No bids
          </div>
        ) : (
          bids
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
                      height: "2.4em",
                      background: "rgb(0 0 0 / 25%)",
                    }}
                  />
                ) : (
                  <div style={{ width: "25vw" }} />
                )}
              </React.Fragment>
            ))
        )}
      </div>
    </Marquee>
  );
}
