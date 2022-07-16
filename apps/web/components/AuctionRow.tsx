import { Box } from "degen";
import { Auction } from "../services/interfaces/noun.service";
import { AuctionRowRoot } from "./AuctionRow.css";
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
  const {
    ensName: ownerENSName,
    // avatarURI: ownerAvatarURI
  } = useProfile(noun.owner.address);
  const { ensName: bidderENSName } = useProfile(auction.bidder?.address);

  // const isEnded = useMemo(
  //   () => isPast(fromUnixTime(auction.endTime)),
  //   [auction]
  // );
  const nounName = `${config.name} ${auction.noun.id}`;

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
          style={{ marginRight: "1rem" }}
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

        <div>NOUNS.TV</div>
      </div>
      <Box
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
            }}
          >
            <div style={{ flex: 1 }}>
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
              <div>
                <Text variant="label">High-Bidder</Text>
                <Text
                  // color="textSecondary"
                  variant="medium"
                  // weight="medium"
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
          <Box
            className={AuctionRowRoot}
            style={{
              // minHeight: "70vh",
              background: "#E1D7D5",
            }}
          >
            <Box
              as="a"
              href={`${config.externalBaseURI}/${auction.noun.id}`}
              target="_blank"
              rel="noreferrer"
              style={{ paddingLeft: "2rem" }}
            >
              <Box
                as="img"
                // className={NounImage}
                style={{ display: "block", width: "100%" }}
                src={imageURL || "../assets/loading-skull-noun.gif"}
                alt={`Noun ${auction.noun.id}`}
              />
            </Box>
          </Box>
          <Banner bids={auction.bids} />
          {/* <BidTable bids={auction.bids} /> */}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <iframe
            src="https://app.newshades.xyz/c/62c81262ceb3b1d36c1bd457?theme=nouns-tv"
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              border: 0,
            }}
          />
        </div>
      </Box>
    </div>
  );
}
