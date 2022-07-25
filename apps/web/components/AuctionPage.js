import {
  ImageData,
  getNounSeedFromBlockHash,
  getNounData,
} from "@nouns/assets";
import { buildSVG } from "@nouns/sdk";
import React from "react";
import { useAccount, useProvider, useNetwork, useSignMessage } from "wagmi";
import {
  ConnectButton as RainbowConnectButton,
  useConnectModal,
} from "@rainbow-me/rainbowkit";
import { useRouter } from "next/router";
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

const positionByPartName = {
  head: { top: "26%", left: "73%" },
  glasses: { top: "43.8%", left: "69.7%" },
  body: {
    top: "92%",
    left: "50%",
    transform: "translateY(-50%) translateX(-50%)",
  },
  accessory: { top: "78%", left: "66%" },
  background: { top: "82%", left: "10%" },
};

const iconByPartName = {
  head: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      style={{ display: "block", marginRight: "0.5rem" }}
    >
      <rect width="3" height="3" fill="black" />
      <rect y="3" width="3" height="3" fill="black" />
      <rect y="6" width="3" height="3" fill="black" />
      <rect y="9" width="3" height="3" fill="black" />
      <rect y="12" width="3" height="3" fill="black" />
      <rect x="6" y="12" width="3" height="3" fill="black" />
      <rect x="9" y="12" width="3" height="3" fill="black" />
      <rect y="15" width="3" height="3" fill="black" />
      <rect y="15" width="3" height="3" fill="black" />
      <rect x="3" width="3" height="3" fill="black" />
      <rect x="6" width="3" height="3" fill="black" />
      <rect x="6" y="6" width="3" height="3" fill="black" />
      <rect x="9" width="3" height="3" fill="black" />
      <rect x="12" width="3" height="3" fill="black" />
      <rect x="12" y="6" width="3" height="3" fill="black" />
      <rect x="15" width="3" height="3" fill="black" />
      <rect x="15" width="3" height="3" fill="black" />
      <rect x="15" y="3" width="3" height="3" fill="black" />
      <rect x="15" y="6" width="3" height="3" fill="black" />
      <rect x="15" y="9" width="3" height="3" fill="black" />
      <rect x="15" y="12" width="3" height="3" fill="black" />
      <rect x="15" y="15" width="3" height="3" fill="black" />
      <rect x="15" y="15" width="3" height="3" fill="black" />
      <rect x="12" y="15" width="3" height="3" fill="black" />
      <rect x="15" y="15" width="3" height="3" fill="black" />
      <rect x="9" y="15" width="3" height="3" fill="black" />
      <rect x="6" y="15" width="3" height="3" fill="black" />
      <rect x="3" y="15" width="3" height="3" fill="black" />
    </svg>
  ),
  glasses: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      style={{ display: "block", marginRight: "0.5rem" }}
    >
      <rect width="3" height="3" fill="black" />
      <rect y="3" width="3" height="3" fill="black" />
      <rect y="6" width="3" height="3" fill="black" />
      <rect y="9" width="3" height="3" fill="black" />
      <rect y="12" width="3" height="3" fill="black" />
      <rect y="15" width="3" height="3" fill="black" />
      <rect y="15" width="3" height="3" fill="black" />
      <rect x="3" width="3" height="3" fill="black" />
      <rect x="6" width="3" height="3" fill="black" />
      <rect x="9" width="3" height="3" fill="black" />
      <rect x="6" y="3" width="3" height="3" fill="black" />
      <rect x="3" y="3" width="3" height="3" fill="black" />
      <rect x="6" y="6" width="3" height="3" fill="black" />
      <rect x="3" y="6" width="3" height="3" fill="black" />
      <rect x="6" y="9" width="3" height="3" fill="black" />
      <rect x="3" y="9" width="3" height="3" fill="black" />
      <rect x="6" y="12" width="3" height="3" fill="black" />
      <rect x="3" y="12" width="3" height="3" fill="black" />
      <rect x="6" y="15" width="3" height="3" fill="black" />
      <rect x="3" y="15" width="3" height="3" fill="black" />
      <rect x="12" width="3" height="3" fill="black" />
      <rect x="15" width="3" height="3" fill="black" />
      <rect x="15" width="3" height="3" fill="black" />
      <rect x="15" width="3" height="3" fill="black" />
      <rect x="15" y="15" width="3" height="3" fill="black" />
      <rect x="15" width="3" height="3" fill="black" />
      <rect x="15" y="3" width="3" height="3" fill="black" />
      <rect x="15" y="6" width="3" height="3" fill="black" />
      <rect x="15" y="9" width="3" height="3" fill="black" />
      <rect x="15" y="12" width="3" height="3" fill="black" />
      <rect x="15" y="15" width="3" height="3" fill="black" />
      <rect y="15" width="3" height="3" fill="black" />
      <rect x="9" y="15" width="3" height="3" fill="black" />
      <rect x="6" y="15" width="3" height="3" fill="black" />
      <rect x="3" y="15" width="3" height="3" fill="black" />
      <rect x="15" y="15" width="3" height="3" fill="black" />
      <rect x="15" y="15" width="3" height="3" fill="black" />
      <rect x="12" y="15" width="3" height="3" fill="black" />
      <rect x="15" y="15" width="3" height="3" fill="black" />
      <rect x="9" y="15" width="3" height="3" fill="black" />
      <rect x="6" y="15" width="3" height="3" fill="black" />
      <rect x="3" y="15" width="3" height="3" fill="black" />
    </svg>
  ),
  body: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      style={{ display: "block", marginRight: "0.5rem" }}
    >
      <rect width="3" height="3" fill="black" />
      <rect y="3" width="3" height="3" fill="black" />
      <rect y="6" width="3" height="3" fill="black" />
      <rect y="9" width="3" height="3" fill="black" />
      <rect y="12" width="3" height="3" fill="black" />
      <rect y="15" width="3" height="3" fill="black" />
      <rect y="15" width="3" height="3" fill="black" />
      <rect x="3" width="3" height="3" fill="black" />
      <rect x="3" y="3" width="3" height="3" fill="black" />
      <rect x="6" width="3" height="3" fill="black" />
      <rect x="9" width="3" height="3" fill="black" />
      <rect x="6" y="15" width="3" height="3" fill="black" />
      <rect x="12" width="3" height="3" fill="black" />
      <rect x="15" width="3" height="3" fill="black" />
      <rect x="15" width="3" height="3" fill="black" />
      <rect x="15" width="3" height="3" fill="black" />
      <rect x="15" y="15" width="3" height="3" fill="black" />
      <rect x="15" width="3" height="3" fill="black" />
      <rect x="15" y="3" width="3" height="3" fill="black" />
      <rect x="15" y="6" width="3" height="3" fill="black" />
      <rect x="15" y="9" width="3" height="3" fill="black" />
      <rect x="15" y="12" width="3" height="3" fill="black" />
      <rect x="15" y="15" width="3" height="3" fill="black" />
      <rect y="15" width="3" height="3" fill="black" />
      <rect x="9" y="15" width="3" height="3" fill="black" />
      <rect x="6" y="15" width="3" height="3" fill="black" />
      <rect x="15" y="15" width="3" height="3" fill="black" />
      <rect x="15" y="15" width="3" height="3" fill="black" />
      <rect x="12" y="15" width="3" height="3" fill="black" />
      <rect x="15" y="15" width="3" height="3" fill="black" />
      <rect x="9" y="15" width="3" height="3" fill="black" />
      <rect x="6" y="15" width="3" height="3" fill="black" />
      <rect x="6" y="12" width="3" height="3" fill="black" />
      <rect x="6" y="9" width="3" height="3" fill="black" />
      <rect x="6" y="6" width="3" height="3" fill="black" />
      <rect x="6" y="3" width="3" height="3" fill="black" />
      <rect x="9" y="12" width="3" height="3" fill="black" />
      <rect x="9" y="9" width="3" height="3" fill="black" />
      <rect x="9" y="6" width="3" height="3" fill="black" />
      <rect x="9" y="3" width="3" height="3" fill="black" />
      <rect x="12" y="12" width="3" height="3" fill="black" />
      <rect x="12" y="9" width="3" height="3" fill="black" />
      <rect x="12" y="6" width="3" height="3" fill="black" />
      <rect x="12" y="3" width="3" height="3" fill="black" />
    </svg>
  ),
  accessory: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      style={{ display: "block", marginRight: "0.5rem" }}
    >
      <rect width="3" height="3" fill="black" />
      <rect y="3" width="3" height="3" fill="black" />
      <rect y="6" width="3" height="3" fill="black" />
      <rect x="6" y="6" width="3" height="3" fill="black" />
      <rect x="9" y="6" width="3" height="3" fill="black" />
      <rect x="9" y="9" width="3" height="3" fill="black" />
      <rect x="6" y="9" width="3" height="3" fill="black" />
      <rect y="9" width="3" height="3" fill="black" />
      <rect y="12" width="3" height="3" fill="black" />
      <rect y="15" width="3" height="3" fill="black" />
      <rect y="15" width="3" height="3" fill="black" />
      <rect x="3" width="3" height="3" fill="black" />
      <rect x="6" width="3" height="3" fill="black" />
      <rect x="9" width="3" height="3" fill="black" />
      <rect x="6" y="15" width="3" height="3" fill="black" />
      <rect x="3" y="15" width="3" height="3" fill="black" />
      <rect x="12" width="3" height="3" fill="black" />
      <rect x="15" width="3" height="3" fill="black" />
      <rect x="15" width="3" height="3" fill="black" />
      <rect x="15" width="3" height="3" fill="black" />
      <rect x="15" y="15" width="3" height="3" fill="black" />
      <rect x="15" width="3" height="3" fill="black" />
      <rect x="15" y="3" width="3" height="3" fill="black" />
      <rect x="15" y="6" width="3" height="3" fill="black" />
      <rect x="15" y="9" width="3" height="3" fill="black" />
      <rect x="15" y="12" width="3" height="3" fill="black" />
      <rect x="15" y="15" width="3" height="3" fill="black" />
      <rect y="15" width="3" height="3" fill="black" />
      <rect x="9" y="15" width="3" height="3" fill="black" />
      <rect x="6" y="15" width="3" height="3" fill="black" />
      <rect x="3" y="15" width="3" height="3" fill="black" />
      <rect x="15" y="15" width="3" height="3" fill="black" />
      <rect x="15" y="15" width="3" height="3" fill="black" />
      <rect x="12" y="15" width="3" height="3" fill="black" />
      <rect x="15" y="15" width="3" height="3" fill="black" />
      <rect x="9" y="15" width="3" height="3" fill="black" />
      <rect x="6" y="15" width="3" height="3" fill="black" />
      <rect x="3" y="15" width="3" height="3" fill="black" />
    </svg>
  ),
  background: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      style={{ display: "block", marginRight: "0.5rem" }}
    >
      <rect width="3" height="3" fill="black" />
      <rect y="3" width="3" height="3" fill="black" />
      <rect y="6" width="3" height="3" fill="black" />
      <rect y="9" width="3" height="3" fill="black" />
      <rect y="12" width="3" height="3" fill="black" />
      <rect y="15" width="3" height="3" fill="black" />
      <rect y="15" width="3" height="3" fill="black" />
      <rect x="3" width="3" height="3" fill="black" />
      <rect x="6" width="3" height="3" fill="black" />
      <rect x="9" width="3" height="3" fill="black" />
      <rect x="6" y="15" width="3" height="3" fill="black" />
      <rect x="3" y="15" width="3" height="3" fill="black" />
      <rect x="12" width="3" height="3" fill="black" />
      <rect x="15" width="3" height="3" fill="black" />
      <rect x="15" width="3" height="3" fill="black" />
      <rect x="15" width="3" height="3" fill="black" />
      <rect x="15" y="15" width="3" height="3" fill="black" />
      <rect x="15" width="3" height="3" fill="black" />
      <rect x="12" y="3" width="3" height="3" fill="black" />
      <rect x="9" y="6" width="3" height="3" fill="black" />
      <rect x="6" y="3" width="3" height="3" fill="black" />
      <rect x="3" y="6" width="3" height="3" fill="black" />
      <rect x="6" y="9" width="3" height="3" fill="black" />
      <rect x="9" y="12" width="3" height="3" fill="black" />
      <rect x="12" y="9" width="3" height="3" fill="black" />
      <rect x="3" y="12" width="3" height="3" fill="black" />
      <rect x="15" y="3" width="3" height="3" fill="black" />
      <rect x="15" y="6" width="3" height="3" fill="black" />
      <rect x="15" y="9" width="3" height="3" fill="black" />
      <rect x="15" y="12" width="3" height="3" fill="black" />
      <rect x="15" y="15" width="3" height="3" fill="black" />
      <rect y="15" width="3" height="3" fill="black" />
      <rect x="9" y="15" width="3" height="3" fill="black" />
      <rect x="6" y="15" width="3" height="3" fill="black" />
      <rect x="3" y="15" width="3" height="3" fill="black" />
      <rect x="15" y="15" width="3" height="3" fill="black" />
      <rect x="15" y="15" width="3" height="3" fill="black" />
      <rect x="12" y="15" width="3" height="3" fill="black" />
      <rect x="15" y="15" width="3" height="3" fill="black" />
      <rect x="9" y="15" width="3" height="3" fill="black" />
      <rect x="6" y="15" width="3" height="3" fill="black" />
      <rect x="3" y="15" width="3" height="3" fill="black" />
    </svg>
  ),
};

const parseParts = (parts) => {
  const [body, accessory, head, glasses] = parts.map((p) => {
    const name = p.filename.split("-").slice(1).join(" ");
    return name[0].toUpperCase() + name.slice(1);
  });
  return { body, accessory, head, glasses };
};

export function AuctionPage() {
  const router = useRouter();
  const { config } = useServiceContext();
  const {
    auction,
    activeBlock,
    fomo: { isFomo, isVotingActive },
  } = useAuction();

  const iFrameRef = React.useRef(null);
  useEmbeddedChatMessager(iFrameRef);

  const nounId = auction?.noun.id;

  const nextNoun = React.useMemo(() => {
    if (nounId == null || activeBlock?.hash == null) return null;
    const seed = getNounSeedFromBlockHash(nounId + 1, activeBlock.hash);
    const { parts, background } = getNounData(seed);
    const svgBinary = buildSVG(parts, ImageData.palette, background);
    const imageUrl = `data:image/svg+xml;base64,${btoa(svgBinary)}`;
    return { id: nounId + 1, parts: parseParts(parts), background, imageUrl };
  }, [nounId, activeBlock]);

  const noun = nextNoun;

  if (auction == null || noun == null) return null;

  const backgroundName = {
    e1d7d5: "Warm",
    d5d7e1: "Cold",
  }[noun.background.toLowerCase()];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Header />
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "stretch",
          background: "rgb(25 25 25)",
        }}
      >
        <div style={{ flex: 2, minWidth: 0, background: "rgb(38 38 38)" }}>
          <AuctionScreenHeader auction={auction} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0,1fr))",
              alignItems: "flex-end",
              background: `#${noun.background}`,
            }}
          >
            <div style={{ paddingLeft: "2rem" }}>
              <div style={{ position: "relative" }}>
                {/* eslint-disable-next-line */}
                <img
                  src={noun.imageUrl || "../assets/loading-skull-noun.gif"}
                  alt={`Noun ${noun.id}`}
                  style={{ display: "block", width: "100%" }}
                />
                {/* <FloatingLabel position={{}} /> */}
                {Object.entries(noun.parts).map(([name, title]) => (
                  <FloatingNounTraitLabel
                    key={name}
                    name={name}
                    title={title}
                  />
                ))}
                <FloatingNounTraitLabel
                  name="background"
                  title={backgroundName}
                />
              </div>
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

const Header = () => (
  <div
    style={{
      background: "black",
      display: "flex",
      height: "60px",
      alignItems: "center",
      padding: "0 20px",
      paddingRight: "15px", // To match the chat
      color: "white",
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
    <div style={{ flex: 1, padding: "0 1rem" }}>
      {/* <img */}
      {/*   src={nextBlockNounImageUrl || "../assets/loading-skull-noun.gif"} */}
      {/*   alt={`Noun ${nounId + 1}`} */}
      {/*   style={{ display: "inline-flex", width: "2rem", height: "2rem" }} */}
      {/* />{" "} */}
      {/* {activeBlock?.localTimestamp != null && ( */}
      {/*   <CountdownDisplay to={activeBlock.localTimestamp + 6} /> */}
      {/* )} */}
    </div>
    <div>
      <RainbowConnectButton />
    </div>
  </div>
);

const ScreenHeader = ({ children }) => (
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
    {children}
  </div>
);

const AuctionScreenHeader = ({ auction }) => {
  const { ensName: ownerENSName } = useProfile(auction?.noun.ownerAddress);
  const { ensName: bidderENSName } = useProfile(auction?.bidderAddress);
  return (
    <ScreenHeader>
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
          gridGap: "2em",
        }}
      >
        <div
          style={{
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <Label>High-Bidder</Label>
          {auction.noun != null && (
            <Heading2>
              {auction.settled
                ? ownerENSName || shortenAddress(auction.noun.ownerAddress)
                : auction.bidderAddress
                ? bidderENSName || shortenAddress(auction.bidderAddress)
                : "NO BIDS YET"}
            </Heading2>
          )}
        </div>
        <div>
          <Label>Current bid</Label>
          <Heading2>
            {"Ξ"} {toFixed(formatEther(auction.amount), 2)}
          </Heading2>
        </div>
        <div>
          <Label>Auction ends in</Label>
          <Heading2 style={{}}>
            <CountdownDisplay to={auction.endTime} />
            <div
              aria-hidden="true"
              style={{
                fontVariantNumeric: "tabular-nums",
                height: 0,
                opacity: 0,
                pointerEvents: "none",
              }}
            >
              99h 99m 99s
            </div>
          </Heading2>
        </div>
      </div>
      <div
        style={{
          background: "#EB4C2B",
          borderRadius: "5px",
          height: "2.8em",
          padding: "0 1em",
          display: "flex",
          alignItems: "center",
          color: "white",
          marginLeft: "1.5em",
        }}
      >
        <Label style={{ fontSize: "1.45em" }}>LIVE</Label>
      </div>
    </ScreenHeader>
  );
};

const Label = ({ style, ...props }) => (
  <div
    style={{
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      fontSize: "0.8em",
      textTransform: "uppercase",
      fontWeight: "700",
      ...style,
    }}
    {...props}
  />
);

const Heading2 = ({ style, ...props }) => (
  <div
    style={{
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      // textTransform:
      //   bidderENSName || ownerENSName ? "uppercase" : undefined,
      fontSize: "1.4em",
      fontWeight: "700",
      ...style,
    }}
    {...props}
  />
);

const FloatingNounTraitLabel = ({ name, title }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      position: "absolute",
      background: "white",
      width: "max-content",
      padding: "0.6rem 0.8rem 0.6rem 0.6rem",
      fontSize: "1.5rem",
      fontWeight: "500",
      borderRadius: "0.3rem",
      transform: "translateY(-50%) translateX(-1rem)",
      ...positionByPartName[name],
    }}
  >
    {iconByPartName[name]}
    {title}
  </div>
);
