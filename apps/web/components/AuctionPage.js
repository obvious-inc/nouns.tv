import React, { RefObject } from "react";
import { useAccount, useProvider, useNetwork, useSignMessage } from "wagmi";
// import { readContract } from "@wagmi/core";
import {
  ConnectButton as RainbowConnectButton,
  useConnectModal,
} from "@rainbow-me/rainbowkit";
// import { getNounData } from "@nouns/assets";
import { useRouter } from "next/router";
// import { Auction } from "../services/interfaces/noun.service";
// import { useNoun } from "../hooks/useNoun";
import { useProfile } from "../hooks/useProfile";
import { Text } from "../elements/Text";
import { useAuction } from "../hooks/useAuction";
import { useServiceContext } from "../hooks/useServiceContext";
import { toFixed } from "../utils/numbers";
import { shortenAddress } from "../utils/address";
import { CountdownDisplay } from "./CountdownDisplay";
import { Banner } from "./Banner";
import { formatEther } from "ethers/lib/utils";

const chatUrl = new URL(process.env.NEXT_PUBLIC_EMBEDDED_CHANNEL_URL);

const useLatestCallback = (callback) => {
  const ref = React.useRef();

  React.useLayoutEffect(() => {
    ref.current = callback;
  });

  const stableCallback = React.useCallback((...args) => {
    ref.current(...args);
  }, []);

  return stableCallback;
};

const useEmbeddedChatMessager = (iFrameRef) => {
  const provider = useProvider();
  const { address: walletAccountAddress, connector: walletConnector } =
    useAccount({
      onConnect: () => {
        postMessage({ method: "connect" });
      },
    });
  const { chain } = useNetwork();
  const { signMessageAsync: signMessage } = useSignMessage();
  const { openConnectModal } = useConnectModal();

  const postMessage = useLatestCallback(
    ({ id, method, params, result, error }) => {
      const payload = {
        jsonrpc: "2.0",
        id,
        method,
        params,
        result,
      };
      if (error != null) payload.error = error;
      iFrameRef.current.contentWindow.postMessage(payload, chatUrl.origin);
    }
  );

  const processWalletMessage = useLatestCallback(async (message) => {
    const { id, method, params } = message;

    switch (method) {
      case "eth_accounts":
        postMessage({ id, result: [walletAccountAddress].filter(Boolean) });
        break;

      case "eth_requestAccounts": {
        if (walletAccountAddress) {
          postMessage({ id, result: [walletAccountAddress] });
          break;
        }
        openConnectModal();
        postMessage({ id, result: [] });
        break;
      }

      case "eth_chainId":
        postMessage({ id, result: chain?.id });
        break;

      case "personal_sign": {
        try {
          const { utils: ethersUtils } = await import("ethers");
          const message = ethersUtils.toUtf8String(params[0]);
          const signature = await signMessage({ message });
          postMessage({ id, result: signature });
        } catch (error) {
          postMessage({ id, error });
        }
        break;
      }

      default: {
        try {
          const result = await provider.send(method, params);
          postMessage({ id, result });
        } catch (error) {
          postMessage({ id, error });
        }
      }
    }
  });

  // Post wallet connection changes
  React.useEffect(() => {
    const changeHandler = (e) => {
      if (e.account == null) return;
      postMessage({ method: "accountsChanged", params: [[e.account]] });
    };
    const disconnectHandler = () => {
      postMessage({ method: "disconnect" });
    };

    walletConnector?.on("change", changeHandler);
    walletConnector?.on("disconnect", disconnectHandler);
    return () => {
      walletConnector?.removeListener("change", changeHandler);
      walletConnector?.removeListener("disconnect", disconnectHandler);
    };
  }, [walletConnector, postMessage]);

  // React to incoming messages
  React.useEffect(() => {
    const handler = (event) => {
      if (event.origin !== chatUrl.origin || event.data.jsonrpc !== "2.0")
        return;

      processWalletMessage(event.data);
    };

    window.addEventListener("message", handler);

    return () => {
      window.removeEventListener("message", handler);
    };
  }, [processWalletMessage]);
};

export function AuctionPage() {
  const router = useRouter();
  const { config } = useServiceContext();
  const { data: auction } = useAuction();

  const {
    ensName: ownerENSName,
    // avatarURI: ownerAvatarURI
  } = useProfile(auction?.noun?.ownerAddress);
  const { ensName: bidderENSName } = useProfile(auction?.bidderAddress);

  const iFrameRef = React.useRef(null);
  useEmbeddedChatMessager(iFrameRef);

  if (auction == null) return null;

  const parts = auction.noun?.parts ?? [];
  const background = auction.noun?.background ?? "";

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
          paddingRight: "15px", // To match the chat
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
        <div style={{ flex: 1 }} />
        <div>
          <RainbowConnectButton />
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
              {auction.noun != null && (
                <Text variant="large" transform="uppercase">
                  Noun {auction.noun.id}
                </Text>
              )}
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
                {auction.noun != null && (
                  <Text
                    // color="textSecondary"
                    variant="medium"
                    // weight="medium"
                    transform={
                      "uppercase"
                      // bidderENSName || ownerENSName ? "uppercase" : undefined
                    }
                    style={{
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {auction.settled
                      ? ownerENSName ||
                        shortenAddress(auction.noun.ownerAddress)
                      : auction.bidderAddress
                      ? bidderENSName || shortenAddress(auction.bidderAddress)
                      : "NO BIDS YET"}
                  </Text>
                )}
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
              href={`${config.externalBaseURI}/${auction.noun?.id}`}
              target="_blank"
              rel="noreferrer"
              style={{ paddingLeft: "2rem" }}
            >
              {auction.noun != null && (
                <img
                  src={
                    auction.noun.imageUrl || "../assets/loading-skull-noun.gif"
                  }
                  alt={`Noun ${auction.noun.id}`}
                  style={{ display: "block", width: "100%" }}
                />
              )}
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
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {chatUrl != null && (
            <iframe
              ref={iFrameRef}
              src={[
                chatUrl.href,
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
          )}
        </div>
      </div>
    </div>
  );
}
