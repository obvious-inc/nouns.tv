import React from "react";
import { css } from "@emotion/react";
import Marquee from "react-fast-marquee";
import { useProfile } from "../hooks/useProfile";
import { Box } from "degen";
import { formatEther } from "ethers/lib/utils";
import { shortenAddress } from "../utils/address";

const BidBlock = ({ bid }) => {
  const { ensName, avatarURI } = useProfile(bid.bidderAddress, bid.blockNumber);

  return (
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
      <div style={{ fontSize: "1.1em", textAlign: "left" }}>
        <div css={css({ fontWeight: "700" })}>
          {"Ξ"} {formatEther(bid.amount)}
        </div>
        <div css={css({ fontWeight: "400" })} data-address>
          {ensName || shortenAddress(bid.bidderAddress)}
        </div>
      </div>
    </Box>
  );
};

export function Banner({ bids, openBidsDialog }) {
  return (
    <button
      onClick={openBidsDialog}
      style={{
        display: "block",
        width: "100%",
        minHeight: "5.7rem",
        background: "#ffc110",
        border: 0,
        padding: 0,
        borderRadius: 0,
        outline: "none",
        cursor: "pointer",
      }}
    >
      <Marquee direction="right" pauseOnHover gradient={false} speed={60}>
        <div
          style={{
            padding: "0.6em 0",
            minHeight: "5.7rem",
            display: "flex",
            alignItems: "center",
          }}
        >
          {bids == null ? null : bids.length === 0 ? (
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
    </button>
  );
}
