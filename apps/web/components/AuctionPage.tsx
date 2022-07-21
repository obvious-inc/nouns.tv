import { getNounData } from "@nouns/assets";
import { useRouter } from "next/router";
import { Auction } from "../services/interfaces/noun.service";
import { useNoun } from "../hooks/useNoun";
import { useProfile } from "../hooks/useProfile";
import { Text } from "../elements/Text";
import { useAuction } from "../hooks/useAuction";
import { useServiceContext } from "../hooks/useServiceContext";
import { toFixed } from "../utils/numbers";
import { shortenAddress } from "../utils/address";
import { CountdownDisplay } from "./CountdownDisplay";
import { Banner } from "./Banner";
import { formatEther } from "ethers/lib/utils";

type AuctionPageProps = {
  auction: Auction;
};

export function AuctionPage({ auction: initialAuction }: AuctionPageProps) {
  const router = useRouter();
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
  const {
    ensName: ownerENSName,
    // avatarURI: ownerAvatarURI
  } = useProfile(noun.owner.address);
  const { ensName: bidderENSName } = useProfile(auction.bidder?.address);

  const nounName = `${config.name} ${auction.noun.id}`;

  const { parts, background } = getNounData(auction.noun.seed);

  const backgroundName = {
    e1d7d5: "warm",
    d5d7e1: "cold",
  }[background.toLowerCase()];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          background: "black",
          display: "flex",
          height: "60px",
          alignItems: "center",
          padding: "0 20px",
        }}
      >
        <svg
          width="50"
          height="30"
          viewBox="0 0 50 30"
          fill="none"
          style={{ marginRight: "0.6rem" }}
        >
          <rect width="50" height="30" fill="#FF1AD2" />
          <rect x="5" y="5" width="10" height="10" fill="black" />
          <rect x="5" y="15" width="10" height="10" fill="white" />
          <rect x="15" y="5" width="10" height="10" fill="white" />
          <rect x="15" y="15" width="10" height="10" fill="black" />
          <rect x="25" y="5" width="10" height="10" fill="black" />
          <rect x="25" y="15" width="10" height="10" fill="white" />
          <rect x="35" y="5" width="10" height="10" fill="white" />
          <rect x="35" y="15" width="10" height="10" fill="black" />
        </svg>

        <div style={{ color: "white", fontSize: "1.1rem", fontWeight: "800" }}>
          NOUNS.TV
        </div>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "stretch",
          background: "rgb(25 25 25)",
        }}
      >
        <div
          style={{
            flex: 2,
            minWidth: 0,
            // borderRight: "0.3rem solid rgb(241, 206, 24)",
            background: "rgb(38 38 38)",
          }}
        >
          <div
            style={{
              height: "60px",
              background: "white",
              color: "black",
              display: "flex",
              alignItems: "center",
              padding: "0 20px",
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ flex: 1, paddingRight: "1rem" }}>
              <Text variant="large" transform="uppercase">
                {nounName}
              </Text>
            </div>
            <div
              style={{
                display: "grid",
                gridAutoFlow: "column",
                gridAutoColumns: "auto",
                alignItems: "center",
                gridGap: "2rem",
              }}
            >
              <div
                style={{
                  minWidth: 0,
                  overflow: "hidden",
                }}
              >
                <Text
                  variant="label"
                  style={{
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  High-Bidder
                </Text>
                <Text
                  // color="textSecondary"
                  variant="medium"
                  // weight="medium"
                  transform={
                    bidderENSName || ownerENSName ? "uppercase" : undefined
                  }
                  style={{
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {auction.settled
                    ? ownerENSName || shortenAddress(noun.owner.address)
                    : auction?.bidder
                    ? bidderENSName || shortenAddress(auction.bidder.address)
                    : "NO BIDS YET"}
                </Text>
              </div>
              <div>
                <Text variant="label">Current bid</Text>
                <Text variant="medium" transform="uppercase">
                  {/*"Ξ"*/}ETH {toFixed(formatEther(auction.amount), 2)}
                </Text>
              </div>
              <div>
                <Text variant="label">Auction ends in</Text>
                <Text variant="medium" transform="uppercase">
                  <CountdownDisplay to={auction.endTime} />
                </Text>
              </div>
              <div
                style={{
                  background: "#EB4C2B",
                  borderRadius: "5px",
                  height: "40px",
                  padding: "0 1rem",
                  display: "flex",
                  alignItems: "center",
                  color: "white",
                }}
              >
                <Text color="white" variant="medium" transform="uppercase">
                  LIVE
                </Text>
              </div>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0,1fr))",
              alignItems: "flex-end",
              background: `#${background}`,
            }}
          >
            <a
              href={`${config.externalBaseURI}/${auction.noun.id}`}
              target="_blank"
              rel="noreferrer"
              style={{ paddingLeft: "2rem" }}
            >
              <img
                src={imageURL || "../assets/loading-skull-noun.gif"}
                alt={`Noun ${auction.noun.id}`}
                style={{ display: "block", width: "100%" }}
              />
            </a>
            <div
              style={{
                display: "grid",
                gridAutoFlow: "row",
                gridGap: "1rem",
                textTransform: "capitalize",
                paddingBottom: "2rem",
              }}
            >
              {parts.map((part, i) => (
                <div key={i}>
                  {part.filename.split("-")[0]}:{" "}
                  {part.filename.split("-").slice(1).join(" ")}
                </div>
              ))}
              <div>Background: {backgroundName}</div>
            </div>
          </div>
          <Banner bids={auction.bids} />
          {/* <BidTable bids={auction.bids} /> */}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <iframe
            src={[
              process.env.NEXT_PUBLIC_EMBEDDED_CHANNEL_URL,
              router.query.compact ? "compact=1" : undefined,
            ]
              .filter(Boolean)
              .join("?")}
            allow="clipboard-read; clipboard-write"
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              border: 0,
            }}
          />
        </div>
      </div>
    </div>
  );
}
