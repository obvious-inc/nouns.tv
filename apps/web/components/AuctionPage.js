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
// import { useServiceContext } from "../hooks/useServiceContext";
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

const parseParts = (parts = []) => {
  const [body, accessory, head, glasses] = parts.map((p) => {
    const name = p.filename.split("-").slice(1).join(" ");
    return name[0].toUpperCase() + name.slice(1);
  });
  return { body, accessory, head, glasses };
};

export function AuctionPage() {
  const router = useRouter();
  // const { config } = useServiceContext();
  const {
    auction,
    activeBlock,
    // fomo: { isFomo, isVotingActive },
  } = useAuction();

  const iFrameRef = React.useRef(null);
  useEmbeddedChatMessager(iFrameRef);

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
        <div
          style={{
            flex: 2,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            background: "rgb(38 38 38)",
          }}
        >
          <AuctionScreenHeader auction={auction} />
          <AuctionScreen auction={auction} activeBlock={activeBlock} />
          <Banner bids={auction?.bids ?? []} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1 }}></div>
            <div
              style={{
                background: "black",
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "stretch",
              }}
            >
              <div
                style={{
                  padding: "0.7rem 1rem",
                  fontWeight: "600",
                  fontSize: "1.2rem",
                  textTransform: "uppercase",
                  color: "#fff006",
                }}
              >
                TV controls under construction
              </div>
              <div
                style={{
                  alignSelf: "flex-end",
                  height: 0,
                  overflow: "visible",
                  padding: "0 2.3rem 0 0.5rem",
                  display: "flex",
                  alignItems: "flex-end",
                }}
              >
                <ConstructionNoun style={{ width: "5rem" }} />
              </div>
            </div>
          </div>
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

const AuctionScreen = ({
  auction,
  // activeBlock
}) => {
  // const nounId = auction?.noun.id;

  // const nextNoun = React.useMemo(() => {
  //   if (nounId == null || activeBlock?.hash == null) return null;
  //   const seed = getNounSeedFromBlockHash(nounId + 1, activeBlock.hash);
  //   const { parts, background } = getNounData(seed);
  //   const svgBinary = buildSVG(parts, ImageData.palette, background);
  //   const imageUrl = `data:image/svg+xml;base64,${btoa(svgBinary)}`;
  //   return { id: nounId + 1, parts: parseParts(parts), background, imageUrl };
  // }, [nounId, activeBlock]);

  const noun = auction?.noun;
  const parts = parseParts(auction?.noun.parts);

  const backgroundName = {
    e1d7d5: "Warm",
    d5d7e1: "Cold",
  }[noun?.background.toLowerCase()];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0,1fr))",
        alignItems: "flex-end",
        transition: "0.2s background ease-out",
        background: noun == null ? "rgb(213, 215, 225)" : `#${noun.background}`,
      }}
    >
      <div style={{ paddingLeft: "2rem" }}>
        <div style={{ position: "relative" }} className="noun-container">
          {/* eslint-disable-next-line */}
          <img
            src={noun?.imageUrl ?? "../assets/loading-skull-noun.gif"}
            alt={`Noun ${noun?.id}`}
            style={{ display: "block", width: "100%" }}
          />
          {/* <FloatingLabel position={{}} /> */}
          {Object.entries(parts).map(([name, title]) => (
            <FloatingNounTraitLabel key={name} name={name} title={title} />
          ))}
          {backgroundName != null && (
            <FloatingNounTraitLabel name="background" title={backgroundName} />
          )}
        </div>
      </div>
    </div>
  );
};

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
      style={{ marginRight: "0.7em" }}
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

    <div style={{ color: "white", fontSize: "1.25em", fontWeight: "700" }}>
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
        {auction?.noun != null && (
          <div style={{ fontSize: "2em", fontWeight: "900" }}>
            Noun {auction.noun.id}
          </div>
        )}
      </div>
      {auction != null && (
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
            <Heading2>
              {auction.settled
                ? ownerENSName || shortenAddress(auction.noun.ownerAddress)
                : auction.bidderAddress
                ? bidderENSName || shortenAddress(auction.bidderAddress)
                : "NO BIDS YET"}
            </Heading2>
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
      )}

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
    data-noun-trait
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
      cursor: "default",
      transform: "translateY(-50%) translateX(-1rem)",
      ...positionByPartName[name],
    }}
  >
    {iconByPartName[name]}
    {title}
  </div>
);

const ConstructionNoun = ({ style }) => (
  <svg
    width="60"
    height="60"
    viewBox="0 0 60 60"
    fill="none"
    style={{ display: "block", height: "auto", ...style }}
  >
    <path d="M0.1875 0H0V0.1875H0.1875V0Z" fill="#E1D7D5" />
    <path d="M43.125 39.375H16.875V41.25H43.125V39.375Z" fill="#34AC80" />
    <path d="M43.125 41.25H16.875V43.125H43.125V41.25Z" fill="#34AC80" />
    <path d="M43.125 43.125H16.875V45H43.125V43.125Z" fill="#34AC80" />
    <path d="M43.125 45H16.875V46.875H43.125V45Z" fill="#34AC80" />
    <path d="M20.625 46.875H16.875V48.75H20.625V46.875Z" fill="#34AC80" />
    <path d="M43.125 46.875H22.5V48.75H43.125V46.875Z" fill="#34AC80" />
    <path d="M20.625 48.75H16.875V50.625H20.625V48.75Z" fill="#34AC80" />
    <path d="M43.125 48.75H22.5V50.625H43.125V48.75Z" fill="#34AC80" />
    <path d="M20.625 50.625H16.875V52.5H20.625V50.625Z" fill="#34AC80" />
    <path d="M43.125 50.625H22.5V52.5H43.125V50.625Z" fill="#34AC80" />
    <path d="M20.625 52.5H16.875V54.375H20.625V52.5Z" fill="#34AC80" />
    <path d="M43.125 52.5H22.5V54.375H43.125V52.5Z" fill="#34AC80" />
    <path d="M20.625 54.375H16.875V56.25H20.625V54.375Z" fill="#34AC80" />
    <path d="M43.125 54.375H22.5V56.25H43.125V54.375Z" fill="#34AC80" />
    <path d="M20.625 56.25H16.875V58.125H20.625V56.25Z" fill="#34AC80" />
    <path d="M43.125 56.25H22.5V58.125H43.125V56.25Z" fill="#34AC80" />
    <path d="M20.625 58.125H16.875V60H20.625V58.125Z" fill="#34AC80" />
    <path d="M43.125 58.125H22.5V60H43.125V58.125Z" fill="#34AC80" />
    <path d="M28.125 43.125H26.25V45H28.125V43.125Z" fill="#4B65F7" />
    <path d="M33.75 43.125H31.875V45H33.75V43.125Z" fill="#4B65F7" />
    <path d="M28.125 45H24.375V46.875H28.125V45Z" fill="#4B65F7" />
    <path d="M31.875 45H30V46.875H31.875V45Z" fill="#4B65F7" />
    <path d="M35.625 45H33.75V46.875H35.625V45Z" fill="#4B65F7" />
    <path d="M28.125 46.875H24.375V48.75H28.125V46.875Z" fill="#4B65F7" />
    <path d="M33.75 46.875H31.875V48.75H33.75V46.875Z" fill="#4B65F7" />
    <path d="M28.125 50.625H24.375V52.5H28.125V50.625Z" fill="#4B65F7" />
    <path d="M31.875 50.625H30V52.5H31.875V50.625Z" fill="#4B65F7" />
    <path d="M28.125 52.5H24.375V54.375H28.125V52.5Z" fill="#4B65F7" />
    <path d="M33.75 52.5H30V54.375H33.75V52.5Z" fill="#4B65F7" />
    <path d="M26.25 54.375H24.375V56.25H26.25V54.375Z" fill="#4B65F7" />
    <path d="M35.625 54.375H30V56.25H35.625V54.375Z" fill="#4B65F7" />
    <path d="M28.125 7.5H18.75V9.375H28.125V7.5Z" fill="#EEDC00" />
    <path d="M37.5 7.5H28.125V9.375H37.5V7.5Z" fill="#FFF006" />
    <path d="M28.125 9.375H16.875V11.25H28.125V9.375Z" fill="#FFF006" />
    <path d="M30 9.375H28.125V11.25H30V9.375Z" fill="#EEDC00" />
    <path d="M39.375 9.375H30V11.25H39.375V9.375Z" fill="#FFF006" />
    <path d="M26.25 11.25H15V13.125H26.25V11.25Z" fill="#EEDC00" />
    <path d="M30 11.25H26.25V13.125H30V11.25Z" fill="#FFF006" />
    <path d="M31.875 11.25H30V13.125H31.875V11.25Z" fill="#EEDC00" />
    <path d="M41.25 11.25H31.875V13.125H41.25V11.25Z" fill="#FFF006" />
    <path d="M26.25 13.125H13.125V15H26.25V13.125Z" fill="#FFF006" />
    <path d="M28.125 13.125H26.25V15H28.125V13.125Z" fill="#EEDC00" />
    <path d="M31.875 13.125H28.125V15H31.875V13.125Z" fill="#FFF006" />
    <path d="M33.75 13.125H31.875V15H33.75V13.125Z" fill="#EEDC00" />
    <path d="M43.125 13.125H33.75V15H43.125V13.125Z" fill="#FFF006" />
    <path d="M28.125 15H13.125V16.875H28.125V15Z" fill="#FFF006" />
    <path d="M30 15H28.125V16.875H30V15Z" fill="#EEDC00" />
    <path d="M31.875 15H30V16.875H31.875V15Z" fill="#FFF006" />
    <path d="M33.75 15H31.875V16.875H33.75V15Z" fill="#EEDC00" />
    <path d="M43.125 15H33.75V16.875H43.125V15Z" fill="#FFF006" />
    <path d="M28.125 16.875H11.25V18.75H28.125V16.875Z" fill="#FFF006" />
    <path d="M30 16.875H28.125V18.75H30V16.875Z" fill="#EEDC00" />
    <path d="M33.75 16.875H30V18.75H33.75V16.875Z" fill="#FFF006" />
    <path d="M43.125 16.875H33.75V18.75H43.125V16.875Z" fill="#EEDC00" />
    <path d="M45 16.875H43.125V18.75H45V16.875Z" fill="#FFF006" />
    <path d="M28.125 18.75H11.25V20.625H28.125V18.75Z" fill="#FFF006" />
    <path d="M30 18.75H28.125V20.625H30V18.75Z" fill="#EEDC00" />
    <path d="M45 18.75H30V20.625H45V18.75Z" fill="#FFF006" />
    <path d="M28.125 20.625H11.25V22.5H28.125V20.625Z" fill="#FFF006" />
    <path d="M30 20.625H28.125V22.5H30V20.625Z" fill="#EEDC00" />
    <path d="M45 20.625H30V22.5H45V20.625Z" fill="#FFF006" />
    <path d="M28.125 22.5H11.25V24.375H28.125V22.5Z" fill="#FFF006" />
    <path d="M30 22.5H28.125V24.375H30V22.5Z" fill="#EEDC00" />
    <path d="M45 22.5H30V24.375H45V22.5Z" fill="#FFF006" />
    <path d="M28.125 24.375H11.25V26.25H28.125V24.375Z" fill="#FFF006" />
    <path d="M30 24.375H28.125V26.25H30V24.375Z" fill="#EEDC00" />
    <path d="M45 24.375H30V26.25H45V24.375Z" fill="#FFF006" />
    <path d="M28.125 26.25H11.25V28.125H28.125V26.25Z" fill="#FFF006" />
    <path d="M30 26.25H28.125V28.125H30V26.25Z" fill="#EEDC00" />
    <path d="M45 26.25H30V28.125H45V26.25Z" fill="#FFF006" />
    <path d="M28.125 28.125H11.25V30H28.125V28.125Z" fill="#FFF006" />
    <path d="M30 28.125H28.125V30H30V28.125Z" fill="#EEDC00" />
    <path d="M45 28.125H30V30H45V28.125Z" fill="#FFF006" />
    <path d="M28.125 30H11.25V31.875H28.125V30Z" fill="#FFF006" />
    <path d="M30 30H28.125V31.875H30V30Z" fill="#EEDC00" />
    <path d="M45 30H30V31.875H45V30Z" fill="#FFF006" />
    <path d="M16.875 31.875H11.25V33.75H16.875V31.875Z" fill="#FFF006" />
    <path d="M45 31.875H16.875V33.75H45V31.875Z" fill="#EEDC00" />
    <path d="M16.875 33.75H9.375V35.625H16.875V33.75Z" fill="#FFF006" />
    <path d="M18.75 33.75H16.875V35.625H18.75V33.75Z" fill="#EEDC00" />
    <path d="M43.125 33.75H18.75V35.625H43.125V33.75Z" fill="black" />
    <path d="M45 33.75H43.125V35.625H45V33.75Z" fill="#EEDC00" />
    <path d="M54.375 33.75H45V35.625H54.375V33.75Z" fill="#FFF006" />
    <path d="M16.875 35.625H9.375V37.5H16.875V35.625Z" fill="#FFF006" />
    <path d="M18.75 35.625H16.875V37.5H18.75V35.625Z" fill="#EEDC00" />
    <path d="M43.125 35.625H18.75V37.5H43.125V35.625Z" fill="#FFF006" />
    <path d="M45 35.625H43.125V37.5H45V35.625Z" fill="#EEDC00" />
    <path d="M54.375 35.625H45V37.5H54.375V35.625Z" fill="#FFF006" />
    <path d="M54.375 37.5H9.375V39.375H54.375V37.5Z" fill="#FFF006" />
    <path d="M30 20.625H18.75V22.5H30V20.625Z" fill="#F3322C" />
    <path d="M43.125 20.625H31.875V22.5H43.125V20.625Z" fill="#F3322C" />
    <path d="M20.625 22.5H18.75V24.375H20.625V22.5Z" fill="#F3322C" />
    <path d="M24.375 22.5H20.625V24.375H24.375V22.5Z" fill="white" />
    <path d="M28.125 22.5H24.375V24.375H28.125V22.5Z" fill="black" />
    <path d="M30 22.5H28.125V24.375H30V22.5Z" fill="#F3322C" />
    <path d="M33.75 22.5H31.875V24.375H33.75V22.5Z" fill="#F3322C" />
    <path d="M37.5 22.5H33.75V24.375H37.5V22.5Z" fill="white" />
    <path d="M41.25 22.5H37.5V24.375H41.25V22.5Z" fill="black" />
    <path d="M43.125 22.5H41.25V24.375H43.125V22.5Z" fill="#F3322C" />
    <path d="M20.625 24.375H13.125V26.25H20.625V24.375Z" fill="#F3322C" />
    <path d="M24.375 24.375H20.625V26.25H24.375V24.375Z" fill="white" />
    <path d="M28.125 24.375H24.375V26.25H28.125V24.375Z" fill="black" />
    <path d="M33.75 24.375H28.125V26.25H33.75V24.375Z" fill="#F3322C" />
    <path d="M37.5 24.375H33.75V26.25H37.5V24.375Z" fill="white" />
    <path d="M41.25 24.375H37.5V26.25H41.25V24.375Z" fill="black" />
    <path d="M43.125 24.375H41.25V26.25H43.125V24.375Z" fill="#F3322C" />
    <path d="M15 26.25H13.125V28.125H15V26.25Z" fill="#F3322C" />
    <path d="M20.625 26.25H18.75V28.125H20.625V26.25Z" fill="#F3322C" />
    <path d="M24.375 26.25H20.625V28.125H24.375V26.25Z" fill="white" />
    <path d="M28.125 26.25H24.375V28.125H28.125V26.25Z" fill="black" />
    <path d="M30 26.25H28.125V28.125H30V26.25Z" fill="#F3322C" />
    <path d="M33.75 26.25H31.875V28.125H33.75V26.25Z" fill="#F3322C" />
    <path d="M37.5 26.25H33.75V28.125H37.5V26.25Z" fill="white" />
    <path d="M41.25 26.25H37.5V28.125H41.25V26.25Z" fill="black" />
    <path d="M43.125 26.25H41.25V28.125H43.125V26.25Z" fill="#F3322C" />
    <path d="M15 28.125H13.125V30H15V28.125Z" fill="#F3322C" />
    <path d="M20.625 28.125H18.75V30H20.625V28.125Z" fill="#F3322C" />
    <path d="M24.375 28.125H20.625V30H24.375V28.125Z" fill="white" />
    <path d="M28.125 28.125H24.375V30H28.125V28.125Z" fill="black" />
    <path d="M30 28.125H28.125V30H30V28.125Z" fill="#F3322C" />
    <path d="M33.75 28.125H31.875V30H33.75V28.125Z" fill="#F3322C" />
    <path d="M37.5 28.125H33.75V30H37.5V28.125Z" fill="white" />
    <path d="M41.25 28.125H37.5V30H41.25V28.125Z" fill="black" />
    <path d="M43.125 28.125H41.25V30H43.125V28.125Z" fill="#F3322C" />
    <path d="M30 30H18.75V31.875H30V30Z" fill="#F3322C" />
    <path d="M43.125 30H31.875V31.875H43.125V30Z" fill="#F3322C" />
  </svg>
);
