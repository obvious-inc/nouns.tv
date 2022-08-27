import formatDate from "date-fns/format";
import { css, keyframes } from "@emotion/react";
import React from "react";
import { useAccount, useProvider, useNetwork, useSignMessage } from "wagmi";
import {
  ConnectButton as RainbowConnectButton,
  useConnectModal,
} from "@rainbow-me/rainbowkit";
import { useRouter } from "next/router";
import { SITE_TITLE } from "../utils/seo";
import { useProfile } from "../hooks/useProfile";
import { useAuction } from "../hooks/useAuction";
import { shortenAddress } from "../utils/address";
import { useLayoutEffect } from "../utils/react";
import { CountdownDisplay } from "./CountdownDisplay";
import Dialog from "./Dialog";
import { Banner } from "./Banner";
import { formatEther } from "ethers/lib/utils";

const STACKED_MODE_BREAKPOINT = "1000px";

const random = (seed) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

const progressGradient = keyframes({
  "0%": {
    backgroundPosition: "0%",
  },
  "100%": {
    backgroundPosition: "200%",
  },
});

const noGifs = [
  "https://c.tenor.com/_Yg4KymK8skAAAAS/hell-nah-i-give-you-the-wag.gif",
  "https://c.tenor.com/hnOfwHfxp0IAAAAM/mike-peps.gif",
  "https://c.tenor.com/aCItDdSljoAAAAAM/nah-man.gif",
  "https://c.tenor.com/Uoh5CrkplOQAAAAd/smh-laugh.gif",
  "https://c.tenor.com/a4oPUc0mvhsAAAAS/throw-up-dry-heave.gif",
  "https://c.tenor.com/GVHE94wLwG4AAAAS/whet-what.gif",
  "https://c.tenor.com/IywGEo-8gNAAAAAS/gross-nasty.gif",
  "https://c.tenor.com/CqJJhD3yocsAAAAS/uh-oh.gif",
  "https://c.tenor.com/pTQ1cO-LsaYAAAAC/uh-wtf.gif",
  "https://c.tenor.com/WZB_2H2htckAAAAM/ew-gross.gif",
  "https://c.tenor.com/AIQAS4l0uAIAAAAM/ew-yuck.gif",
  "https://c.tenor.com/JBlp2G_dqqcAAAAC/new-girl.gif",
];
const yesGifs = [
  "https://c.tenor.com/fmZuKGPpf3cAAAAS/yes-yes-yes-yes.gif",
  "https://c.tenor.com/zLdksqBjgdMAAAAS/yas-oh-yeah.gif",
  "https://c.tenor.com/5FI2iWeIs70AAAAd/yes-yes-yes.gif",
  "https://c.tenor.com/dbA2b82g77cAAAAS/proud-ross.gif",
  "https://c.tenor.com/yr2TZIdaOukAAAAd/pedro-approves-pedrorc.gif",
  "https://c.tenor.com/BNg5I6x4wUsAAAAC/im-so-excited-freaking-cant-wait.gif",
  "https://c.tenor.com/2w1XsfvQD5kAAAAC/hhgf.gif",
  "https://c.tenor.com/Nh7N6tq8SnYAAAAd/friends-rachel-green.gif",
  "https://c.tenor.com/cuGev1KFtZkAAAAC/yes-yas.gif",
  "https://c.tenor.com/FS2PD8WU9RgAAAAC/yes-yay.gif",
  "https://c.tenor.com/inZhd-3tflYAAAAd/new-girl-winston-bishop.gif",
];

let preloadedGifs;
const preloadGifs = () => {
  if (preloadedGifs != null) return;
  preloadedGifs = [...noGifs, ...yesGifs].map((url) => {
    const img = new Image();
    img.src = url;
    return img;
  });
};

const TEXT_ERROR = "#e85252";

const chatUrl = new URL(process.env.NEXT_PUBLIC_EMBEDDED_CHANNEL_URL);

const useLatestCallback = (callback) => {
  const ref = React.useRef();

  useLayoutEffect(() => {
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
    if (p == null) return null;
    const name = p.filename.split("-").slice(1).join(" ");
    return name[0].toUpperCase() + name.slice(1);
  });
  return { body, accessory, head, glasses };
};

const getSeedStats = (nouns, nounId) => {
  if (nouns.some((n) => n == null)) return null;

  const noun = nouns.find((n) => Number(n.id) === Number(nounId));

  if (noun == null) return null;

  const partNames = ["head", "body", "glasses", "accessory"];

  const partCounts = nouns.reduce((acc, n) => {
    for (let partName of partNames) {
      const partId = n.seed[partName];
      const partCount = acc[partName]?.[partId] ?? 0;
      acc[partName] = {
        ...acc[partName],
        [partId]: partCount + 1,
      };
    }

    return acc;
  }, {});

  return Object.fromEntries(
    partNames.map((partName) => {
      const id = noun.seed[partName];
      const count = partCounts[partName]?.[id] ?? 0;
      const total = nouns.length;
      return [partName, { id, count, total }];
    })
  );
};

export function AuctionPage({ nouns }) {
  const router = useRouter();
  const { auction, auctionEnded, bidding, settling, fomo } = useAuction();

  const stats = getSeedStats(
    fomo.isActive
      ? [...nouns, fomo.noun]
      : nouns.some((n) => Number(n.id) === auction?.nounId)
      ? nouns
      : [...nouns, auction?.noun],
    fomo.isActive ? fomo.noun?.id : auction?.nounId
  );

  // const [forceFomo, setForceFomo] = React.useState(false);
  // const toggleForceFomo = () => setForceFomo((s) => !s);
  const [forceStats, setForceStats] = React.useState(false);
  const toggleForceStats = () => setForceStats((s) => !s);

  const iFrameRef = React.useRef(null);
  useEmbeddedChatMessager(iFrameRef);

  const [displayBidDialog, setDisplayBidDialog] = React.useState(false);
  const toggleDisplayBidDialog = () => setDisplayBidDialog((s) => !s);

  const auctionMode = React.useMemo(() => {
    if (auction == null) return "loading";
    if (auctionEnded) return "awaiting-settle";
    return "bidding";
  }, [auction, auctionEnded]);

  const {
    bid,
    amount,
    setAmount,
    isLoading: hasPendingBid,
    isLoadingTransactionResponse: hasPendingBidTransactionCall,
    error: biddingError,
  } = bidding;

  const {
    settle: settleAuction,
    isLoading: hasPendingSettleAttempt,
    isLoadingTransactionResponse: hasPendingSettleTransactionCall,
    error: settlingError,
  } = settling;

  const biddingEnabled = bid != null && !hasPendingBid;

  const auctionActionButtonElement =
    auctionMode === "loading" ? null : auctionMode === "awaiting-settle" ? (
      <GrayButton
        type="button"
        disabled={hasPendingSettleAttempt || settleAuction == null}
        isLoading={hasPendingSettleAttempt}
        onClick={() => {
          settleAuction();
        }}
        hint={hasPendingSettleTransactionCall && "Confirm with your wallet"}
        error={settlingError?.reason ?? settlingError?.message}
      >
        {hasPendingSettleAttempt ? "Settling auction..." : "Settle auction"}
      </GrayButton>
    ) : (
      <GrayButton
        onClick={() => {
          toggleDisplayBidDialog();
        }}
      >
        Place a bid
      </GrayButton>
    );

  return (
    <>
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Header />
        <div
          style={{
            flex: "1 1 0",
            display: "flex",
            alignItems: "stretch",
            background: "rgb(25 25 25)",
          }}
          css={css({
            [`@media (max-width: ${STACKED_MODE_BREAKPOINT})`]: {
              flexDirection: "column",
            },
          })}
        >
          <div
            css={css({
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              background: "rgb(38 38 38)",
              [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
                flex: "1 1 0",
              },
            })}
          >
            <AuctionScreenHeader
              auction={auction}
              bidding={bidding}
              settling={settling}
              auctionEnded={auctionEnded}
              auctionActionButtonElement={auctionActionButtonElement}
            />
            {fomo.isActive ? (
              <FomoScreen
                {...fomo}
                nounImageElement={
                  <NounImage
                    noun={fomo.noun}
                    stats={stats}
                    forceStats={forceStats}
                  />
                }
                controlsElement={
                  <div
                    style={{
                      display: "grid",
                      gridAutoColumns: "auto",
                      gridAutoFlow: "column",
                      gridGap: "1.5rem",
                      pointerEvents: "none",
                    }}
                  >
                    <Switch
                      id="stats-switch"
                      label="Stats"
                      checked={forceStats}
                      onChange={toggleForceStats}
                    />
                    {/* <Switch */}
                    {/*   id="fomo-switch" */}
                    {/*   label="FOMO" */}
                    {/*   checked={forceFomo} */}
                    {/*   onChange={toggleForceFomo} */}
                    {/* /> */}
                  </div>
                }
                auctionActionButtonElement={auctionActionButtonElement}
              />
            ) : (
              <AuctionScreen
                auction={auction}
                nounImageElement={
                  <NounImage
                    noun={auction?.noun}
                    stats={stats}
                    forceStats={forceStats}
                  />
                }
                auctionActionButtonElement={auctionActionButtonElement}
                controlsElement={
                  <div
                    style={{
                      display: "grid",
                      gridAutoColumns: "auto",
                      gridAutoFlow: "column",
                      gridGap: "1.5rem",
                      pointerEvents: "none",
                    }}
                  >
                    <Switch
                      id="stats-switch"
                      label="Stats"
                      checked={forceStats}
                      onChange={toggleForceStats}
                    />
                    {/* <Switch */}
                    {/*   id="fomo-switch" */}
                    {/*   label="FOMO" */}
                    {/*   checked={forceFomo} */}
                    {/*   onChange={toggleForceFomo} */}
                    {/* /> */}
                  </div>
                }
              />
            )}
            <div
              css={css({
                display: fomo.isActive ? "none" : "block",
                [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
                  display: "block",
                },
              })}
            >
              <Banner bids={auction?.bids ?? []} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                  css={css({
                    flex: 1,
                    minHeight: 0,
                    [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
                      minHeight: "10rem",
                    },
                  })}
                >
                  {/* TODO */}
                </div>
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
                      position: "relative",
                      zIndex: 1,
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
          </div>
          <div
            css={css({
              flex: "1 1 0",
              maxWidth: "100%",
              minHeight: 0,
              [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
                width: "44rem",
                flex: "none",
              },
            })}
          >
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
      <Dialog
        isOpen={displayBidDialog}
        onRequestClose={toggleDisplayBidDialog}
        style={{ padding: "2.5rem 2rem 3.5rem", width: "35rem" }}
      >
        {({ titleProps }) => (
          <>
            <header style={{ textAlign: "center" }}>
              <h3
                {...titleProps}
                style={{ margin: 0, fontSize: "3rem", fontWeight: "900" }}
              >
                TV SHOP
              </h3>
              <div
                style={{
                  fontSize: "1.4rem",
                  fontWeight: "700",
                  margin: "0 0 2rem",
                }}
              >
                Place a bid on noun {auction?.nounId}
              </div>
            </header>
            <main>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  bid().then(() => {
                    setDisplayBidDialog(false);
                  });
                }}
                style={{
                  width: "25rem",
                  maxWidth: "100%",
                  margin: "0 auto",
                }}
              >
                <div
                  css={css({
                    height: "5rem",
                    width: "100%",
                    background: "white",
                    border: "0.1rem solid black",
                    borderRadius: "1rem",
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    padding: "0 1rem",
                    display: "flex",
                    alignItems: "center",
                    margin: "0 0 1rem",
                  })}
                  style={{
                    borderColor: hasPendingBid ? "hsl(0 0% 70%)" : undefined,
                  }}
                >
                  <div
                    style={{
                      padding: "0 0.5rem",
                      color:
                        hasPendingBid || amount.trim() === ""
                          ? "rgb(0 0 0 / 54%)"
                          : "inherit",
                    }}
                  >
                    {"Ξ"}
                  </div>
                  <input
                    id="bid-amount"
                    name="amount"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                    }}
                    disabled={hasPendingBid}
                    placeholder={
                      auction.amount == null || auction.amount.isZero() // First bid
                        ? parseFloat(formatEther(auction.reservePrice)) > 0.0001 // If the reserve price is big enough to bother
                          ? `${formatEther(auction.reservePrice)} or higher`
                          : "Snatch the first bid!"
                        : `${formatEther(
                            auction.amount?.add(
                              auction.amount
                                ?.div(100)
                                .mul(auction.minBidIncrementPercentage ?? 2)
                            )
                          )} or higher`
                    }
                    autoComplete="off"
                    css={css({
                      flex: 1,
                      background: "none",
                      border: 0,
                      fontSize: "inherit",
                      fontWeight: "inherit",
                      fontFamily: "inherit",
                      padding: "0",
                      outline: "none",
                      "::placeholder": { color: "rgb(0 0 0 / 54%)" },
                      ":disabled": {
                        pointerEvents: "none",
                      },
                    })}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!biddingEnabled}
                  isLoading={hasPendingBid}
                  hint={hasPendingBidTransactionCall && "Check your wallet"}
                  style={{
                    borderRadius: "1rem",
                    width: "100%",
                    minHeight: "5rem",
                  }}
                >
                  {hasPendingBid ? "Placing bid..." : "Place bid"}
                </Button>
                {biddingError != null && (
                  <div
                    css={css({
                      marginTop: "1rem",
                      color: TEXT_ERROR,
                      fontSize: "1.4rem",
                      fontWeight: "500",
                      ":first-letter": { textTransform: "uppercase" },
                    })}
                  >
                    {biddingError.reason ?? biddingError.message}
                  </div>
                )}
              </form>
            </main>
          </>
        )}
      </Dialog>
    </>
  );
}

const AuctionScreen = ({
  auction,
  nounImageElement,
  controlsElement,
  auctionActionButtonElement,
}) => {
  const noun = auction?.noun;

  return (
    <div
      css={css({
        display: "flex",
        flexDirection: "column",
        transition: "0.2s background ease-out",
        background: noun == null ? "rgb(213, 215, 225)" : `#${noun.background}`,
        minHeight: "12rem",
        position: "relative",
        // Top nav and header + bids banner is 3 x 6rem hight, + 3rem for the "under construction" banner
        maxHeight: "max(12rem, calc(50vh - 6rem * 3 - 3rem))",
        [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
          flex: "1 1 0",
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0,1fr))",
          alignItems: "stretch",
          maxHeight: "none",
        },
      })}
    >
      <div
        css={css({
          minHeight: 0,
          display: "flex",
          alignItems: "stretch",
          justifyContent: "center",
          [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
            paddingLeft: "2rem",
          },
        })}
      >
        {nounImageElement}
      </div>
      <div />
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          padding: "1rem 1.5rem",
        }}
      >
        {controlsElement}
      </div>
      <div
        css={css({
          display: "none",
          [`@media (max-width: ${STACKED_MODE_BREAKPOINT})`]: {
            display: "block",
            position: "absolute",
            bottom: 0,
            right: 0,
            padding: "1rem 1.5rem",
          },
        })}
      >
        {auctionActionButtonElement}
      </div>
    </div>
  );
};

const NounImage = ({ noun, stats, forceStats, noStats }) => {
  const parts = parseParts(noun?.parts);

  const backgroundName = {
    e1d7d5: "Warm",
    d5d7e1: "Cold",
  }[noun?.background.toLowerCase()];

  return (
    <div
      style={{ position: "relative" }}
      className="noun-container"
      css={css({
        "[data-noun-trait]": {
          opacity: forceStats ? 1 : 0,
          transition: "0.1s opacity ease-out",
        },
        ":hover [data-noun-trait]": {
          opacity: 1,
        },
      })}
    >
      {/* eslint-disable-next-line */}
      <img
        src={noun?.imageUrl ?? "../assets/loading-skull-noun.gif"}
        alt={`Noun ${noun?.id}`}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "bottom",
        }}
      />
      {!noStats && (
        <>
          {Object.entries(parts)
            .filter((e) => e[1] != null)
            .map(([name, title]) => (
              <FloatingNounTraitLabel
                key={name}
                name={name}
                title={title}
                stats={stats?.[name]}
              />
            ))}
          {backgroundName != null && (
            <FloatingNounTraitLabel name="background" title={backgroundName} />
          )}
        </>
      )}
    </div>
  );
};

const FomoScreen = ({
  // isActive,
  noun,
  noundersNoun,
  block,
  vote,
  isVotingActive,
  like,
  dislike,
  score,
  settlementAttempted,
  voteCounts,
  isConnected,
  nounImageElement,
  controlsElement,
  auctionActionButtonElement,
  // reconnect,
}) => {
  React.useEffect(() => {
    preloadGifs();
  }, []);

  const [noGifUrl, yesGifUrl] = React.useMemo(() => {
    if (block == null) return [];
    return [
      noGifs[Math.floor(random(Number(block.number)) * noGifs.length)],
      yesGifs[Math.floor(random(Number(block.number)) * yesGifs.length)],
    ];
  }, [block]);

  return (
    <div
      css={css({
        display: "flex",
        flexDirection: "column-reverse",
        transition: "0.2s background ease-out",
        background: noun == null ? "rgb(213, 215, 225)" : `#${noun.background}`,
        minHeight: 0,
        position: "relative",
        [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
          flex: "1 1 0",
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0,1fr))",
          alignItems: "stretch",
        },
      })}
    >
      <div
        css={css({
          flex: "1 1 auto",
          height: "12rem",
          display: "flex",
          alignItems: "stretch",
          justifyContent: "center",
          position: "relative",
          [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
            height: "auto",
            flex: "none",
            paddingLeft: "2rem",
          },
        })}
      >
        {nounImageElement}
        {noundersNoun != null && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "12%",
              minWidth: "6rem",
              height: "auto",
              transform: "translateX(10%) translateY(10%)",
              border: "0.1rem solid black",
              borderRadius: "0.5rem",
              overflow: "hidden",
            }}
          >
            <NounImage noun={noundersNoun} noStats />
          </div>
        )}
      </div>
      <div
        css={css({
          display: "flex",
          alignItems: "center",
          minHeight: 0,
          position: "relative",
        })}
      >
        {!isConnected ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* <GrayButton onClick={reconnect}>Reconnect</GrayButton> */}
          </div>
        ) : (
          block != null && (
            <div
              css={css({
                textAlign: "center",
                padding: "2rem 3rem 1rem",
                [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
                  padding: "2rem 4rem",
                  paddingLeft: "1rem",
                },
                width: "100%",
                button: {
                  position: "relative",
                  display: "block",
                  border: "0.1rem solid black",
                  padding: "0.5rem",
                  borderRadius: "0.5rem",
                  background: "hsl(0 0% 85%)",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "0.1s transform ease-out",
                  ":hover": {
                    background: "hsl(0 0% 80%)",
                  },
                  ":hover img": {
                    filter: "saturate(1.25)",
                  },
                  "&[data-selected=true]": {
                    boxShadow: "0 0 0 0.3rem #667af9",
                  },
                  "&[data-selected=true] img": {
                    filter: "saturate(1.2)",
                  },
                  ":disabled": {
                    cursor: "not-allowed",
                    pointerEvents: "none",
                  },
                  ":not([data-selected=true]):disabled": {
                    borderColor: "hsl(0 0% 60%)",
                  },
                  ":not([data-selected=true]):disabled img": {
                    filter: "saturate(0) contrast(60%)",
                  },
                  ".label": {
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: "50%",
                    padding: "1rem 1.5rem",
                    fontWeight: "800",
                    color: "white",
                    transform: "translateY(-50%) rotate(-5deg) scale(0.5)",
                    WebkitTextStroke: "1px black",
                    opacity: 0,
                    transition: "0.07s all ease-in",
                  },
                  ":hover .label, &[data-selected=true] .label": {
                    opacity: 1,
                    transform: "translateY(-50%) rotate(-5deg) scale(1)",
                  },
                },
                img: {
                  display: "block",
                  width: "7rem",
                  height: "7rem",
                  objectFit: "cover",
                  transition: "0.1s transform ease-out",
                  borderRadius: "0.2rem",
                  [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
                    width: "12rem",
                    height: "12rem",
                  },
                },
              })}
            >
              <div
                css={css({
                  display: "none",
                  fontSize: "2.8rem",
                  fontWeight: "700",
                  margin: "0 0 0.7rem",
                  [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
                    display: "block",
                  },
                })}
              >
                {settlementAttempted
                  ? "Attempting to settle..."
                  : isVotingActive
                  ? "Try to mint this noun?"
                  : "Ok, let’s try another one"}
              </div>
              <div
                css={css({
                  fontSize: "1.4rem",
                  fontWeight: "500",
                  margin: "0 0 1rem",
                  [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
                    color: "hsl(0 0% 40%)",
                    margin: "0 0 2.2rem",
                    fontSize: "1.6rem",
                    fontWeight: "600",
                  },
                })}
              >
                {settlementAttempted ? (
                  "OMG OMG OMG OMG OMG"
                ) : isVotingActive ? (
                  <>
                    Voting ends in{" "}
                    <CountdownDisplay to={block.localTimestamp / 1000 + 7} />
                  </>
                ) : (
                  <>
                    Waiting for a new block...{" "}
                    <span
                      style={{
                        display: "inline-flex",
                        transform: "scale(1.2)",
                        margin: "0 0.2rem",
                      }}
                    >
                      🥱
                    </span>
                  </>
                )}
              </div>
              <div
                css={css({
                  position: "relative",
                  width: "100%",
                  maxWidth: "42rem",
                  margin: "0 auto 1.5rem",
                  [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
                    margin: "0 auto 3rem",
                  },
                })}
              >
                <div
                  css={css({
                    height: "2.4rem",
                    width: "100%",
                    borderRadius: "0.5rem",
                    background:
                      "linear-gradient(90deg, rgba(0,179,255,1) 0%, rgba(255,0,209,1) 25%, rgba(255,160,0,1) 50%, rgba(243,255,0,1) 75%, rgba(0,179,255,1) 100%)",
                    animation: `${progressGradient} 6s linear infinite`,
                    backgroundSize: "200%",
                    position: "relative",
                    overflow: "hidden",
                  })}
                >
                  <div
                    css={css({
                      position: "absolute",
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: `${
                        100 -
                        (settlementAttempted
                          ? 100
                          : Math.max(5, Math.min(100, score * 100)))
                      }%`,
                      transition:
                        "0.2s width ease-out, 0.2s background ease-out",
                      background: isVotingActive ? "white" : "hsl(0 0% 70%)",
                    })}
                  />
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    transform: "translateY(-50%)",
                    right: "100%",
                    padding: "0 0.8rem",
                    fontSize: "1.3rem",
                    fontWeight: "500",
                  }}
                >
                  {String(voteCounts.dislike ?? 0)}
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    transform: "translateY(-50%)",
                    left: "100%",
                    padding: "0 0.8rem",
                    fontSize: "1.3rem",
                    fontWeight: "500",
                  }}
                >
                  {String(voteCounts.like ?? 0)}
                </div>
              </div>
              <div
                css={css({
                  display: "grid",
                  maxWidth: "42rem",
                  margin: "0 auto",
                  gridTemplateColumns: "repeat(2, minmax(0,auto))",
                  justifyContent: "space-evenly",
                  userSelect: "none",
                })}
              >
                <button
                  onClick={dislike}
                  disabled={!isVotingActive || vote != null}
                  data-selected={vote === "dislike"}
                >
                  <img alt="NO" key={noGifUrl} src={noGifUrl} />
                  <div className="label" style={{ fontSize: "5rem" }}>
                    NO
                  </div>
                </button>
                <button
                  onClick={like}
                  disabled={!isVotingActive || vote != null}
                  data-selected={vote === "like"}
                >
                  <img key={yesGifUrl} alt="YES" src={yesGifUrl} />
                  <div className="label" style={{ fontSize: "4.2rem" }}>
                    YES
                  </div>
                </button>
              </div>
            </div>
          )
        )}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          padding: "1rem 1.5rem",
        }}
      >
        {controlsElement}
      </div>
      <div
        css={css({
          display: "none",
          [`@media (max-width: ${STACKED_MODE_BREAKPOINT})`]: {
            display: "block",
            position: "absolute",
            bottom: 0,
            right: 0,
            padding: "1rem 1.5rem",
          },
        })}
      >
        {auctionActionButtonElement}
      </div>
    </div>
  );
};

const Header = () => (
  <div
    style={{
      background: "black",
      display: "flex",
      minHeight: "6rem",
      alignItems: "center",
      padding: "0 2rem",
      paddingRight: "1.5rem", // To match the chat
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

    <div
      style={{
        color: "white",
        fontSize: "1.25em",
        fontWeight: "700",
        textTransform: "uppercase",
      }}
    >
      {SITE_TITLE}
    </div>
    <div style={{ flex: 1, padding: "0 1rem" }}></div>
    <div>
      <RainbowConnectButton />
    </div>
  </div>
);

const ScreenHeader = ({ children }) => (
  <div
    style={{
      fontSize: "1rem",
      minHeight: "6em",
      background: "white",
      color: "black",
      display: "flex",
      alignItems: "center",
      padding: "1em 2em",
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </div>
);

const AuctionScreenHeader = ({
  auction,
  auctionEnded,
  auctionActionButtonElement,
}) => {
  const [isTimer, setIsTimer] = React.useState(true);
  const toggleTimer = () => setIsTimer((s) => !s);

  const { ensName: ownerENSName } = useProfile(auction?.noun.ownerAddress);
  const { ensName: bidderENSName } = useProfile(auction?.bidderAddress);
  const bidderShort =
    auction?.bidderAddress == null
      ? null
      : bidderENSName ?? shortenAddress(auction.bidderAddress);

  return (
    <ScreenHeader>
      <div
        css={css({
          display: "none",
          [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
            display: "block",
            flex: 1,
            paddingRight: "1em",
          },
        })}
      >
        {auction?.noun != null && (
          <div
            style={{
              fontSize: "3em",
              fontWeight: "900",
            }}
          >
            Noun {auction.noun.id}{" "}
            {auctionEnded && (
              <span css={css({ fontSize: "0.6em", fontWeight: "500" })}>
                (Auction ended)
              </span>
            )}
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
            <Label>{auctionEnded ? "Winner" : "High-Bidder"}</Label>
            <Heading2>
              {auction.settled
                ? ownerENSName || shortenAddress(auction.noun.ownerAddress)
                : auctionEnded
                ? auction.amount.isZero()
                  ? "-"
                  : bidderShort
                : auction.amount.isZero()
                ? "No bids"
                : bidderShort}
            </Heading2>
          </div>
          <div>
            {auction?.amount != null && (
              <>
                <Label>{auctionEnded ? "Winning bid" : "Current bid"}</Label>
                <Heading2>
                  {auction.amount.isZero() ? (
                    "-"
                  ) : (
                    <>
                      {"Ξ"} {formatEther(auction.amount)}
                    </>
                  )}
                </Heading2>
              </>
            )}
          </div>
          {!auctionEnded && (
            <button
              onClick={toggleTimer}
              style={{
                background: "none",
                padding: 0,
                border: 0,
                textAlign: "left",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              <Label>{isTimer ? "Auction ends in" : "Auction ends at"}</Label>
              <Heading2>
                {isTimer ? (
                  <CountdownDisplay to={auction.endTime} />
                ) : (
                  new Intl.DateTimeFormat(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit",
                  }).format(new Date(auction.endTime * 1000))
                )}
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
            </button>
          )}
        </div>
      )}

      <div
        css={css({
          display: "none",
          [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
            display: "block",
            marginLeft: "1.5rem",
          },
        })}
      >
        {auctionActionButtonElement}
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
      fontSize: "1.1em",
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
      fontSize: "2em",
      fontWeight: "700",
      ...style,
    }}
    {...props}
  />
);

const FloatingNounTraitLabel = ({ name, title, stats }) => {
  return (
    <div
      data-noun-trait
      style={{
        position: "absolute",
        background: "white",
        width: "max-content",
        padding: "0.6rem 0.8rem 0.6rem 0.6rem",
        fontSize: "1.5rem",
        fontWeight: "500",
        borderRadius: "0.3rem",
        cursor: "default",
        transform: "translateY(-50%) translateX(-1rem)",
        zIndex: 2,
        ...positionByPartName[name],
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
        }}
      >
        {iconByPartName[name]}
        {title}
      </div>
      {stats != null && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: "1.3rem",
            fontWeight: "500",
            color: "hsl(0 0% 36%)",
            margin: "0.3rem 0 0",
          }}
        >
          {stats.count === 1 ? (
            <>
              First appearance
              <svg
                width="11"
                height="11"
                viewBox="0 0 11 11"
                fill="none"
                style={{
                  display: "block",
                  width: "1.2rem",
                  height: "auto",
                  marginLeft: "0.3rem",
                }}
              >
                <path
                  d="M4.07942 4.84659C4.40544 4.79947 4.68734 4.59481 4.83312 4.29941L5.50043 2.94719L6.16774 4.29941C6.31337 4.5945 6.59485 4.79906 6.92048 4.84645L8.41111 5.06338L7.33263 6.11402C7.09674 6.34382 6.98911 6.67503 7.04486 6.9996L7.30002 8.48509L5.96545 7.78408C5.6743 7.63114 5.32656 7.63114 5.0354 7.78408L3.70084 8.48509L3.956 6.9996C4.0117 6.67527 3.90428 6.3443 3.66873 6.11451L2.58975 5.06191L4.07942 4.84659Z"
                  fill="#FFC110"
                  stroke="#FFC110"
                  strokeWidth="2"
                />
              </svg>
            </>
          ) : (
            <>
              Rarity: {stats.count}/{stats.total}
            </>
          )}
        </div>
      )}
    </div>
  );
};

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

const Button = ({
  component: Component = "button",
  hint,
  isLoading = false,
  children,
  ...props
}) => (
  <Component
    css={css({
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      height: "4rem",
      background: "white",
      border: 0,
      borderRadius: "0.5rem",
      fontSize: "1.5rem",
      fontWeight: "600",
      fontFamily: "inherit",
      padding: "0 1.5rem",
      outline: "none",
      maxWidth: "100%",
      background: "#667AF9",
      color: "white",
      cursor: "pointer",
      transition: "0.1s all easy-out",
      textAlign: "left",
      ":hover": {
        filter: "brightness(1.03) saturate(1.2)",
      },
      ":disabled": {
        opacity: "0.8",
        color: "hsl(0 0% 100% / 80%)",
        pointerEvents: "none",
      },
    })}
    {...props}
  >
    <div>
      {children}
      {hint != null && (
        <div css={css({ fontSize: "1rem", fontWeight: "500" })}>{hint}</div>
      )}
    </div>
    {isLoading && <Spinner size="1.5rem" style={{ marginLeft: "1rem" }} />}
  </Component>
);

const rotateAnimation = keyframes({
  "100%": {
    transform: "rotate(360deg)",
  },
});

const dashAnimation = keyframes({
  "0%": {
    strokeDasharray: "90 150",
    strokeDashoffset: 90,
  },
  "50%": {
    strokeDasharray: "90 150",
    strokeDashoffset: -45,
  },
  "100%": {
    strokeDasharray: "90 150",
    strokeDashoffset: -120,
  },
});

const Spinner = ({
  size = "2rem",
  color = "currentColor",
  strokeWidth = 6,
  style,
}) => (
  <svg
    viewBox="0 0 50 50"
    style={{ width: size, height: "auto", color, ...style }}
    css={css({
      animation: `${rotateAnimation} 2.5s linear infinite`,
      circle: {
        animation: `${dashAnimation} 2s ease-in-out infinite`,
      },
    })}
  >
    <circle
      cx="25"
      cy="25"
      r="20"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth={strokeWidth}
    />
  </svg>
);

const GrayButton = ({
  component: Component = "button",
  isLoading,
  error,
  hint,
  children,
  ...props
}) => (
  <Component
    css={css({
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      border: "0.1rem solid black",
      borderRadius: "0.5rem",
      background: "hsl(0 0% 85%)",
      cursor: "pointer",
      padding: "0 1rem",
      minHeight: "4rem",
      fontSize: "1.5rem",
      fontFamily: "inherit",
      fontWeight: "500",
      textAlign: "left",
      color: "black",
      ":hover": {
        background: "hsl(0 0% 80%)",
      },
      ":disabled": {
        cursor: "not-allowed",
        pointerEvents: "none",
        borderColor: "hsl(0 0% 65%)",
        color: "hsl(0 0% 46%)",
      },
    })}
    {...props}
  >
    <div>
      {children}
      {(hint != null || error != null) && (
        <div
          css={css({
            fontSize: "1rem",
            fontWeight: "500",
            color: error != null ? "red" : undefined,
          })}
        >
          {error ?? hint}
        </div>
      )}
    </div>
    {isLoading && <Spinner size="1.5rem" style={{ marginLeft: "1rem" }} />}
  </Component>
);

const Switch = ({ id, label, ...props }) => (
  <label
    htmlFor={id}
    css={css({
      pointerEvents: "all",
      fontSize: "1.3rem",
      fontWeight: "600",
      color: "hsl(0 0% 46%)",
      cursor: "pointer",
      userSelect: "none",
      transition: "8ms color ease-out",
      ":hover": { color: "hsl(0 0% 25%)" },
    })}
  >
    <input
      id={id}
      type="checkbox"
      {...props}
      css={css({
        WebkitAppearance: "none",
        padding: 0,
        paddingRight: "0.3rem",
        cursor: "pointer",
        color: "inherit",
        outline: "none",
        transition: "0.1s color ease-out",
        ":after": {
          content: '""',
          display: "inline-flex",
          background: "currentColor",
          width: "1rem",
          height: "1rem",
          border: "0.2rem solid white",
          borderRightWidth: "1.2rem",
        },
        ":checked:after": {
          borderRightWidth: "0.2rem",
          borderLeftWidth: "1.2rem",
        },
      })}
    />
    {label}
  </label>
);
