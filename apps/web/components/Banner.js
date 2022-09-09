import React from "react";
import { css } from "@emotion/react";
import Marquee from "react-fast-marquee";
import { useProfile } from "../hooks/useProfile";
import { EtherscanPageType, getEtherscanLink } from "../utils/url";
import { Box } from "degen";
import { formatEther } from "ethers/lib/utils";
import { shortenAddress } from "../utils/address";

const BidBlock = ({ bid }) => {
  const { ensName, avatarURI } = useProfile(bid.bidderAddress, bid.blockNumber);

  const bidderEtherscanLink = getEtherscanLink(
    EtherscanPageType.ADDRESS,
    bid.bidderAddress
  );

  return (
    <Box display="flex" flexDirection="row" alignItems="center">
      {avatarURI && (
        <Link
          href={bidderEtherscanLink}
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
        </Link>
      )}
      <div style={{ fontSize: "1.1em" }}>
        <Link
          href={getEtherscanLink(EtherscanPageType.TX, bid.transactionHash)}
          css={css({ display: "block", fontWeight: "700" })}
        >
          {"Ξ"} {formatEther(bid.amount)}
        </Link>
        <Link
          href={bidderEtherscanLink}
          css={css({ display: "block", fontWeight: "400" })}
          data-address
        >
          {ensName || shortenAddress(bid.bidderAddress)}
        </Link>
      </div>
    </Box>
  );
};

const Link = ({ href, ...props }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    css={css({ ":hover": { textDecoration: "underline" } })}
    {...props}
  />
);

export function Banner({ bids }) {
  return (
    <div
      style={{
        minHeight: "5.7rem",
        background: "#ffc110",
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
    </div>
  );
}
