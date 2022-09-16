import { css, keyframes, useTheme } from "@emotion/react";
import React from "react";
import { useRect } from "@reach/rect";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEnsName } from "wagmi";
import { STACKED_MODE_BREAKPOINT } from "../constants/layout";
import { getEtherscanLink } from "../utils/url";
import { useProfile } from "../hooks/useProfile";
import { useAuction } from "../hooks/useAuction";
import useMediaQuery from "../hooks/useMediaQuery";
import { shortenAddress } from "../utils/address";
import {
  getSeedStats as getNounSeedStats,
  enhance as enhanceNoun,
} from "../utils/nouns";
import { CountdownDisplay } from "./CountdownDisplay";
import Dialog from "./Dialog";
import ChatLayout from "./ChatLayout";
import Button from "./Button";
import Switch from "./Switch";
import { formatEther } from "ethers/lib/utils";

const random = (seed) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

const rainbowGradient =
  "linear-gradient(90deg, rgba(0,179,255,1) 0%, rgba(255,0,209,1) 25%, rgba(255,160,0,1) 50%, rgba(243,255,0,1) 75%, rgba(0,179,255,1) 100%)";
const highlightGradient =
  "linear-gradient(90deg, rgb(114 214 255) 0%, rgb(255 148 236) 25%, rgb(255 200 107) 50%, rgb(222 255 123) 75%, rgba(114, 214, 255,1) 100%)";
const progressGradientAnimation = keyframes({
  "0%": {
    backgroundPosition: "0%",
  },
  "100%": {
    backgroundPosition: "200%",
  },
});
const highlightGradientAnimation = keyframes({
  "0%": {
    backgroundPosition: "0%",
  },
  "100%": {
    backgroundPosition: "600%",
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
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
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
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
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
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
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
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
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
    <svg width="18" height="18" viewBox="0 0 18 18">
      {" "}
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

const groupBy = (computeKey, list) =>
  list.reduce((acc, item) => {
    const keys = computeKey(item, list);
    for (let key of Array.isArray(keys) ? keys : [keys]) {
      const group = acc[key] ?? [];
      acc[key] = [...group, item];
    }
    return acc;
  }, {});

export function AuctionPage({ noun: noun_, nouns: nouns_, setTheme }) {
  const noun = React.useMemo(
    () => (noun_ == null ? null : enhanceNoun(noun_)),
    [noun_]
  );
  const nouns = React.useMemo(() => nouns_.map(enhanceNoun), [nouns_]);
  const nounIdsByHolderAddresses = React.useMemo(
    () =>
      nouns.reduce((ns, n) => {
        const holderAddress = n.owner.address.toLowerCase();
        const holderNouns = ns[holderAddress] ?? [];
        ns[holderAddress] = [...holderNouns, n.id];
        return ns;
      }, {}),
    [nouns]
  );

  const {
    auction,
    auctionEnded,
    bidding,
    settling,
    fomo,
    // isFetchingInitialBids,
  } = useAuction();
  const router = useRouter();

  const selectedTraitName = router.query.trait;
  const setSelectedTrait = React.useCallback(
    (trait) => {
      const searchParams = new URLSearchParams(location.search);
      if (trait == null) searchParams.delete("trait");
      else searchParams.set("trait", trait);
      router.replace(
        [location.pathname, searchParams.toString()].join("?"),
        undefined,
        {
          shallow: true,
        }
      );
    },
    [router]
  );

  const showTraitDialog = selectedTraitName != null;
  const closeTraitDialog = () => setSelectedTrait(null);

  const [showBidsDialog, setShowBidsDialog] = React.useState(false);
  const toggleBidsDialog = () => setShowBidsDialog((s) => !s);

  const screenMode = React.useMemo(() => {
    if (noun != null) return "static-noun";
    if (fomo.isActive) return "fomo";
    return "auction";
  }, [noun, fomo.isActive]);

  const auctionMode = React.useMemo(() => {
    if (auction == null) return "loading";
    if (auctionEnded) return "awaiting-settle";
    return "bidding";
  }, [auction, auctionEnded]);

  const showLoadingScreen = screenMode === "auction" && auction == null;

  const stats = React.useMemo(() => {
    switch (screenMode) {
      case "static-noun":
        return getNounSeedStats(nouns, noun.id);
      case "fomo":
        return fomo.noun == null
          ? null
          : getNounSeedStats([...nouns, fomo.noun], fomo.noun.id);
      case "auction":
        return auction == null
          ? null
          : getNounSeedStats(
              nouns.some((n) => Number(n.id) === auction.nounId)
                ? nouns
                : [...nouns, auction.noun],
              auction.nounId
            );
      default:
        throw new Error();
    }
  }, [screenMode, fomo.noun, auction, noun, nouns]);

  const [forceStats_, setForceStats] = React.useState(undefined);
  const forceStats =
    typeof forceStats_ === "boolean" ? forceStats_ : screenMode === "fomo";
  const toggleForceStats = () => setForceStats(() => !forceStats);

  const [displayBidDialog, setDisplayBidDialog] = React.useState(false);
  const toggleDisplayBidDialog = () => setDisplayBidDialog((s) => !s);

  const theme = useTheme();
  const isBackgroundActive = theme.light ?? false;
  const toggleBackground = () =>
    setTheme((t) => (t === "light" ? "dark" : "light"));

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
      <Button
        size="default"
        onClick={() => {
          toggleDisplayBidDialog();
        }}
      >
        Place a bid
      </Button>
    );

  const displayedNoun = React.useMemo(() => {
    switch (screenMode) {
      case "static-noun":
        return noun;
      case "fomo":
        return fomo.noun;
      case "auction":
        return auction?.noun;
      default:
        throw new Error();
    }
  }, [screenMode, noun, fomo.noun, auction]);

  const staticNounStatsElement = React.useMemo(() => {
    const parts = parseParts(displayedNoun?.parts);
    return (
      <div
        style={{
          display: "grid",
          gridAutoFlow: "row",
          gridGap: "0.4rem",
          alignSelf: "flex-end",
          padding: "1rem",
        }}
      >
        {["head", "glasses", "body", "accessory"]
          .map((n) => [n, parts[n]])
          .filter((e) => e[1] != null)
          .map(([name, title]) => {
            const labelProps = { name, title, stats: stats?.[name] };
            const isFirstAppearance = labelProps.stats?.count === 1;

            if (isFirstAppearance)
              return <NounTraitLabel key={name} {...labelProps} highlight />;

            return (
              <button
                key={name}
                onClick={() => setSelectedTrait(name)}
                css={css({
                  display: "block",
                  width: "max-content",
                  padding: 0,
                  background: "none",
                  border: 0,
                })}
              >
                <NounTraitLabel {...labelProps} />
              </button>
            );
          })}
      </div>
    );
  }, [displayedNoun, stats, setSelectedTrait]);

  return (
    <>
      <ChatLayout
        background={
          isBackgroundActive && displayedNoun != null
            ? `#${displayedNoun.background}`
            : undefined
        }
        showLoadingScreen={showLoadingScreen}
      >
        {screenMode === "static-noun" ? (
          <NounScreenHeader
            noun={displayedNoun}
            navigationElement={
              <HeaderNounNavigation
                auctionNounId={Number(auction?.noun.id)}
                prevNounId={Number(displayedNoun.id) - 1}
                nextNounId={Number(displayedNoun.id) + 1}
              />
            }
          />
        ) : (
          <AuctionScreenHeader
            auction={auction}
            auctionEnded={auctionEnded}
            nounIdsByHolderAddresses={nounIdsByHolderAddresses}
            toggleBidsDialog={toggleBidsDialog}
            navigationElement={
              <HeaderNounNavigation
                auctionNounId={Number(auction?.noun.id)}
                prevNounId={Number(auction?.noun.id) - 1}
                nextNounId={Number(auction?.noun.id) + 1}
              />
            }
            auctionActionButtonElement={auctionActionButtonElement}
          />
        )}
        {screenMode === "fomo" ? (
          <FomoScreen
            {...fomo}
            nounImageElement={
              <NounImage
                noun={displayedNoun}
                stats={stats}
                forceStats={forceStats}
                selectTrait={setSelectedTrait}
              />
            }
            staticNounStatsElement={staticNounStatsElement}
            controlsElement={
              <div
                css={css({
                  display: "grid",
                  gridAutoColumns: "auto",
                  gridAutoFlow: "column",
                  gridGap: "1.5rem",
                  pointerEvents: "none",
                  [`@media (max-width: ${STACKED_MODE_BREAKPOINT})`]: {
                    display: "none",
                  },
                })}
              >
                <Switch
                  label="Stats"
                  isActive={forceStats}
                  onClick={toggleForceStats}
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
            backgroundSwitchElement={
              <Switch
                label="Background"
                isActive={isBackgroundActive}
                onClick={() => {
                  toggleBackground();
                }}
              />
            }
          />
        ) : (
          <NounScreen
            noun={displayedNoun}
            nounImageElement={
              <NounImage
                noun={displayedNoun}
                stats={stats}
                forceStats={forceStats}
                selectTrait={setSelectedTrait}
              />
            }
            staticNounStatsElement={staticNounStatsElement}
            auctionActionButtonElement={
              screenMode === "auction" ? auctionActionButtonElement : null
            }
            backgroundSwitchElement={
              <Switch
                label="Background"
                isActive={isBackgroundActive}
                onClick={() => {
                  toggleBackground();
                }}
              />
            }
          />
        )}

        {/* {(screenMode !== "static-noun" || displayedNoun.auction != null) && ( */}
        {/*   <div */}
        {/*     css={css({ */}
        {/*       display: screenMode === "fomo" ? "none" : "block", */}
        {/*       [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: { */}
        {/*         display: "block", */}
        {/*       }, */}
        {/*     })} */}
        {/*   > */}
        {/*     <Banner */}
        {/*       bids={ */}
        {/*         screenMode === "static-noun" */}
        {/*           ? displayedNoun.auction.bids */}
        {/*           : isFetchingInitialBids */}
        {/*           ? null */}
        {/*           : auction?.bids ?? [] */}
        {/*       } */}
        {/*       openBidsDialog={toggleBidsDialog} */}
        {/*     /> */}
        {/*   </div> */}
        {/* )} */}
      </ChatLayout>

      <DarkDialog
        isOpen={displayBidDialog}
        onRequestClose={toggleDisplayBidDialog}
        style={{ padding: "2rem", width: "32rem" }}
      >
        {({ titleProps }) => (
          <>
            <header style={{ margin: "0 0 1.5rem" }}>
              <h1
                {...titleProps}
                css={css({
                  fontSize: "1.8rem",
                  lineHeight: "1.2",
                  margin: "0",
                })}
              >
                Place a bid on noun {auction?.nounId}
              </h1>
            </header>
            <main css={(theme) => css({ fontSize: theme.fontSizes.default })}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  bid().then(() => {
                    setDisplayBidDialog(false);
                  });
                }}
              >
                <div
                  css={(theme) =>
                    css({
                      display: "flex",
                      alignItems: "center",
                      height: "4.2rem",
                      color: theme.colors.textNormal,
                      background: theme.colors.backgroundSecondary,
                      fontSize: theme.fontSizes.default,
                      fontWeight: "400",
                      borderRadius: "0.3rem",
                      padding: "0.5rem 0.7rem",
                      width: "100%",
                      outline: "none",
                      border: theme.light ? "1px solid rgb(0 0 0 / 20%)" : 0,
                      margin: "0 0 1.5rem",
                      "&:focus-within": {
                        boxShadow: `0 0 0 0.2rem ${theme.colors.primary}`,
                      },
                    })
                  }
                >
                  <div
                    css={(theme) =>
                      css({
                        padding: "0 0.5rem",
                        color:
                          hasPendingBid || amount.trim() === ""
                            ? theme.colors.textDimmed
                            : "inherit",
                      })
                    }
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
                    css={(theme) =>
                      css({
                        flex: 1,
                        background: "none",
                        border: 0,
                        color: "inherit",
                        fontSize: "inherit",
                        fontWeight: "inherit",
                        fontFamily: "inherit",
                        padding: "0",
                        outline: "none",
                        "::placeholder": { color: theme.colors.textDimmed },
                        ":disabled": {
                          pointerEvents: "none",
                        },
                        // Prevents iOS zooming in on input fields
                        "@supports (-webkit-touch-callout: none)": {
                          fontSize: "1.6rem",
                        },
                      })
                    }
                  />
                </div>
                <Button
                  type="submit"
                  size="large"
                  fullWidth
                  variant="primary"
                  disabled={!biddingEnabled}
                  // isLoading={hasPendingBid}
                >
                  {hasPendingBid ? "Placing bid..." : "Place bid"}
                </Button>
                {hasPendingBidTransactionCall && (
                  <div
                    css={(theme) =>
                      css({
                        color: theme.colors.textDimmed,
                        textAlign: "center",
                        marginTop: "1rem",
                      })
                    }
                  >
                    Check your wallet
                  </div>
                )}
                {biddingError != null && (
                  <div
                    css={css({
                      marginTop: "1rem",
                      color: TEXT_ERROR,
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
      </DarkDialog>

      <TraitDialog
        isOpen={showTraitDialog}
        onRequestClose={closeTraitDialog}
        noun={displayedNoun}
        nouns={nouns}
        traitName={selectedTraitName}
      />

      <BidsDialog
        isOpen={showBidsDialog}
        onRequestClose={toggleBidsDialog}
        bids={
          screenMode === "static-noun"
            ? displayedNoun.auction?.bids
            : auction?.bids
        }
        nounIdsByHolderAddresses={nounIdsByHolderAddresses}
      />
    </>
  );
}

const NounScreen = ({
  // noun,
  nounImageElement,
  auctionActionButtonElement,
  staticNounStatsElement,
  backgroundSwitchElement,
}) => {
  const isMobileLayout = useMediaQuery(
    `(max-width: ${STACKED_MODE_BREAKPOINT})`
  );

  return (
    <div
      css={css({
        display: "flex",
        flexDirection: "column",
        transition: "0.2s background ease-out",
        minHeight: "12rem",
        position: "relative",
        overflow: "hidden",
        // // Top nav and header + bids banner is 3 x 6rem hight
        // maxHeight: "max(12rem, calc(50vh - 6rem * 3))",
        [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
          flex: "1 1 0",
          flexDirection: "row",
          // paddingRight: "15%",
          // gridTemplateColumns: "repeat(2, minmax(0,1fr))",
          alignItems: "stretch",
          justifyContent: "stretch",
          maxHeight: "none",
        },
      })}
    >
      <div
        css={css({
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "16rem minmax(0,1fr)",
          padding: "0 1.5rem",
          [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
            display: "block",
            width: "100%",
            height: "100%",
            padding: 0,
          },
        })}
      >
        {nounImageElement}
        {isMobileLayout && staticNounStatsElement}
      </div>
      <div
        css={css({
          position: "absolute",
          top: 0,
          right: 0,
          padding: "0 1.5rem",
          [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
            padding: "1.8rem",
            top: "auto",
            right: "auto",
            left: 0,
            bottom: 0,
          },
        })}
      >
        {auctionActionButtonElement}
      </div>
      <div
        css={css({
          display: "none",
          position: "absolute",
          bottom: 0,
          right: 0,
          padding: "0.5rem",
          [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
            display: "block",
            padding: "1.8rem",
          },
        })}
      >
        {backgroundSwitchElement}
      </div>
    </div>
  );
};

const NounImage = ({ noun, stats, forceStats, noStats, selectTrait }) => {
  const parts = parseParts(noun?.parts);

  const backgroundName = {
    e1d7d5: "Warm",
    d5d7e1: "Cold",
  }[noun?.background.toLowerCase()];

  const ref = React.useRef(null);
  const rect = useRect(ref, { observe: true });
  const size = rect == null ? 0 : Math.min(rect.width, rect.height);

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      className="noun-container"
      css={css({
        "[data-noun-trait]": {
          pointerEvents: "none",
          opacity: 0,
          [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
            pointerEvents: "all",
            opacity: forceStats ? 1 : 0,
          },
        },
        "@media (hover: hover)": {
          "[data-noun-trait]": {
            pointerEvents: forceStats ? "all" : "none",
            opacity: forceStats ? 1 : 0,
            transition: "0.1s opacity ease-out",
          },
          ":hover [data-noun-trait]": {
            pointerEvents: "all",
            opacity: 1,
          },
        },
      })}
    >
      <div
        style={{
          position: "relative",
          width: `${size}px`,
          height: `${size}px`,
        }}
      >
        {/* eslint-disable-next-line */}
        <img
          src={noun?.imageUrlTransparent ?? "../assets/loading-skull-noun.gif"}
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
              .map(([name, title]) => {
                const isFirstAppearance = stats?.[name].count === 1;
                const props = {
                  name,
                  title,
                  stats: stats?.[name],
                };

                if (isFirstAppearance)
                  return (
                    <FloatingNounTraitLabel key={name} {...props} highlight />
                  );

                return (
                  <FloatingNounTraitLabel
                    key={name}
                    component="button"
                    onClick={() => selectTrait(name)}
                    style={{ cursor: "pointer" }}
                    css={(theme) =>
                      css({
                        "@media (hover: hover)": {
                          ":hover": {
                            // boxShadow:
                            //   "0 0 0 1px black, 2px 2px 0 1px rgb(0 0 0 / 10%)",
                            filter: theme.light
                              ? "brightness(95%)"
                              : "brightness(110%)",
                          },
                        },
                      })
                    }
                    {...props}
                  />
                );
              })}

            {backgroundName != null && (
              <FloatingNounTraitLabel
                name="background"
                title={backgroundName}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

const FomoScreen = ({
  // noun,
  noundersNoun,
  block,
  vote,
  isVotingActive,
  like,
  dislike,
  score,
  settlementAttempted,
  // voteCounts,
  isConnected,
  nounImageElement,
  controlsElement,
  staticNounStatsElement,
  backgroundSwitchElement,
  // auctionActionButtonElement,
  // reconnect,
}) => {
  const isMobileLayout = useMediaQuery(
    `(max-width: ${STACKED_MODE_BREAKPOINT})`
  );

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

  const state = settlementAttempted
    ? "attempting-settlement"
    : isVotingActive
    ? vote == null
      ? "voting"
      : "voted"
    : "awaiting-block";

  return (
    <div
      css={css({
        pointerEvents: "all",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        position: "relative",
        [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
          flex: "1 1 0",
        },
      })}
    >
      <div
        css={css({
          display: "flex",
          alignItems: "center",
          minHeight: 0,
          position: "relative",
          [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
            minHeight: "24.6rem",
          },
        })}
      >
        {!isConnected || block == null ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "11.66rem",
            }}
          >
            {/* <GrayButton onClick={reconnect}>Reconnect</GrayButton> */}
          </div>
        ) : isMobileLayout ? (
          <div
            css={css({
              width: "100%",
              padding: "0.5rem 1.5rem 2.5rem",
              pointerEvents: "all",
            })}
          >
            <div
              css={css({
                display: "grid",
                gridTemplateColumns: "auto minmax(0,1fr) auto",
                gridGap: "1rem",
                alignItems: "flex-end",
                userSelect: "none",
              })}
            >
              <VoteGifButton
                isVotingActive={isVotingActive}
                currentVote={vote}
                vote="dislike"
                label="Nah"
                gifUrl={noGifUrl}
                onClick={dislike}
              />
              <div>
                <div
                  css={css({
                    fontSize: "1.4rem",
                    fontWeight: "500",
                    margin: "0 0 0.5rem",
                    textAlign: "center",
                    minHeight: "1.6rem",
                  })}
                >
                  {(() => {
                    switch (state) {
                      case "attempting-settlement":
                        return "OMG OMG OMG OMG OMG";
                      case "voting":
                        return (
                          <>
                            Voting ends in{" "}
                            <CountdownDisplay
                              to={block.localTimestamp / 1000 + 7}
                            />
                          </>
                        );
                      case "voted":
                        return (
                          <>
                            OMG thx for voting!! <Emoji>😍</Emoji>
                          </>
                        );
                      case "awaiting-block":
                        return (
                          <>
                            Waiting for a new block... <Emoji>🥱</Emoji>
                          </>
                        );
                    }
                  })()}
                </div>
                <ProgressBar
                  progress={
                    settlementAttempted ? 1 : Math.max(0, Math.min(1, score))
                  }
                  height="5rem"
                  disabled={!isVotingActive}
                />
              </div>
              <VoteGifButton
                isVotingActive={isVotingActive}
                currentVote={vote}
                vote="like"
                label="yas"
                gifUrl={yesGifUrl}
                onClick={like}
              />
            </div>
          </div>
        ) : (
          <div
            css={css({
              width: "100%",
              textAlign: "center",
              padding: "2rem 4rem",
            })}
          >
            <div
              css={(theme) =>
                css({
                  fontFamily: theme.fontStacks.headers,
                  color: theme.colors.textHeader,
                  lineHeight: 1.2,
                  fontSize: "4.6rem",
                  fontWeight: "600",
                })
              }
            >
              {settlementAttempted
                ? "Attempting to settle..."
                : isVotingActive
                ? "Try to mint this noun?"
                : "Ok, let’s try another one"}
            </div>
            <div
              css={(theme) =>
                css({
                  color: theme.colors.textDimmed,
                  margin: "0 0 2.8rem",
                  fontSize: "1.6rem",
                  fontWeight: "400",
                })
              }
            >
              {(() => {
                switch (state) {
                  case "attempting-settlement":
                    return "OMG OMG OMG OMG OMG";
                  case "voting":
                    return (
                      <>
                        Voting ends in{" "}
                        <CountdownDisplay
                          to={block.localTimestamp / 1000 + 7}
                        />
                      </>
                    );
                  case "voted":
                    return (
                      <>
                        OMG thx for voting!! <Emoji>😍</Emoji>
                      </>
                    );
                  case "awaiting-block":
                    return (
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
                    );
                }
              })()}
            </div>
            <div
              css={css({
                display: "grid",
                gridTemplateColumns: "auto minmax(0,1fr) auto",
                alignItems: "stretch",
                gridGap: "2rem",
                userSelect: "none",
                margin: "0 auto",
              })}
            >
              <VoteGifButton
                isVotingActive={isVotingActive}
                currentVote={vote}
                vote="dislike"
                label="No"
                symbol={"👎"}
                gifUrl={noGifUrl}
                onClick={dislike}
              />
              <div css={css({ position: "relative", width: "100%" })}>
                <ProgressBar
                  progress={
                    settlementAttempted ? 1 : Math.max(0, Math.min(1, score))
                  }
                  height="100%"
                  disabled={!settlementAttempted && !isVotingActive}
                />
                {/* <div */}
                {/*   style={{ */}
                {/*     position: "absolute", */}
                {/*     top: "50%", */}
                {/*     transform: "translateY(-50%)", */}
                {/*     right: "100%", */}
                {/*     padding: "0 0.8rem", */}
                {/*     fontSize: "1.3rem", */}
                {/*     fontWeight: "500", */}
                {/*   }} */}
                {/* > */}
                {/*   {String(voteCounts.dislike ?? 0)} */}
                {/* </div> */}
                {/* <div */}
                {/*   style={{ */}
                {/*     position: "absolute", */}
                {/*     top: "50%", */}
                {/*     transform: "translateY(-50%)", */}
                {/*     left: "100%", */}
                {/*     padding: "0 0.8rem", */}
                {/*     fontSize: "1.3rem", */}
                {/*     fontWeight: "500", */}
                {/*   }} */}
                {/* > */}
                {/*   {String(voteCounts.like ?? 0)} */}
                {/* </div> */}
              </div>
              <VoteGifButton
                isVotingActive={isVotingActive}
                currentVote={vote}
                vote="like"
                label="Yes"
                symbol={"👍"}
                gifUrl={yesGifUrl}
                onClick={like}
              />
            </div>
          </div>
        )}
      </div>

      <div
        css={css({
          flex: "1 1 auto",
          display: "grid",
          gridTemplateColumns: "12rem minmax(0, 1fr)",
          padding: "0 1.5rem",
          position: "relative",
          minHeight: 0,
          [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
            padding: 0,
            flex: "1 1 0",
            display: "block",
            width: "100%",
            height: "100%",
          },
        })}
      >
        {nounImageElement}
        {isMobileLayout && staticNounStatsElement}
        {noundersNoun != null && (
          <div
            style={{
              height: "auto",
              transform: "translateX(10%) translateY(10%)",
              borderRadius: "0.5rem",
              overflow: "hidden",
              background: "white",
            }}
            css={css({
              position: "absolute",
              bottom: "1rem",
              left: "1rem",
              width: "5rem",
              padding: "0.3rem",
              ".title": { display: "none" },
              [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
                padding: "0.5rem",
                width: "15%",
                minWidth: "7rem",
                left: 0,
                top: 0,
                bottom: "auto",
                ".title": { display: "block" },
              },
            })}
          >
            <div
              style={{
                borderRadius: "0.3rem",
                overflow: "hidden",
              }}
            >
              <NounImage noun={noundersNoun} noStats />
            </div>
            <div
              style={{
                textAlign: "center",
                margin: "0.5rem 0 0",
                fontSize: "1rem",
                fontWeight: "700",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
              className="title"
            >
              Noun {noundersNoun.id}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          padding: "0.5rem",
          [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
            padding: "1.8rem",
          },
        }}
      >
        {controlsElement}
      </div>
      <div
        style={{
          display: "none",
          position: "absolute",
          bottom: 0,
          right: 0,
          padding: "0.5rem",
          [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
            display: "block",
            padding: "1.8rem",
          },
        }}
      >
        {backgroundSwitchElement}
      </div>
      {/* <div */}
      {/*   css={css({ */}
      {/*     display: "none", */}
      {/*     [`@media (max-width: ${STACKED_MODE_BREAKPOINT})`]: { */}
      {/*       display: "block", */}
      {/*       position: "absolute", */}
      {/*       bottom: 0, */}
      {/*       right: 0, */}
      {/*       padding: "1rem 1.5rem", */}
      {/*     }, */}
      {/*   })} */}
      {/* > */}
      {/*   {auctionActionButtonElement} */}
      {/* </div> */}
    </div>
  );
};

const VoteGifButton = ({
  label,
  symbol,
  onClick,
  gifUrl,
  vote,
  currentVote,
  isVotingActive,
}) => {
  const disabled = !isVotingActive || currentVote != null;
  return (
    <button
      css={(theme) =>
        css({
          border: theme.light
            ? "1px solid rgb(0 0 0 / 20%)"
            : "1px solid rgba(255, 255, 255, 0.13)",
          position: "relative",
          display: "block",
          padding: "0.5rem",
          borderRadius: "0.5rem",
          background: "none",
          pointerEvents: "all",
          // overflow: "hidden",
          cursor: "pointer",
          transition: "0.1s transform ease-out",
          ":disabled": {
            cursor: "not-allowed",
            pointerEvents: "none",
          },
          "@media (hover: hover)": {
            ":hover": {
              background: theme.light ? "rgb(55 52 47 / 8%)" : "rgb(47 47 47)",
            },
            ":hover img": {
              filter: "saturate(1.25)",
            },
            ":hover .label, &[data-selected=true] .label": {
              opacity: 1,
              transform:
                "translateY(-50%) translateX(-50%) rotate(-5deg) scale(1)",
            },
          },
          "&[data-selected=true]": {
            boxShadow:
              "rgb(46 170 220 / 70%) 0px 0px 0px 1px inset, rgb(46 170 220 / 40%) 0px 0px 0px 3px",
          },
          "&[data-selected=true] img": {
            filter: "saturate(1.2)",
          },
          "&[data-selected=true] .label": {
            opacity: 1,
            transform:
              "translateY(-50%) translateX(-50%) rotate(-5deg) scale(1)",
          },
          // ":not([data-selected=true]):disabled": {
          //   borderColor: "hsl(0 0% 60%)",
          // },
          ":not([data-selected=true]):disabled img": {
            filter: "saturate(0) contrast(60%)",
          },
          ".label": {
            position: "absolute",
            left: "50%",
            top: "50%",
            padding: "1rem 1.5rem",
            fontWeight: "800",
            color: "white",
            transform: "translateY(-50%) translateX(-50%) scale(0.5)",
            transition: "0.07s all ease-in",
            opacity: 0,
            fontSize: "2.8rem",
            [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
              fontSize: "5rem",
            },
          },
          ".hint": {
            position: "absolute",
            top: "calc(100% + 0.8rem)",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "1.4rem",
            fontWeight: "500",
            whiteSpace: "nowrap",
            textAlign: "center",
          },
          img: {
            display: "block",
            width: "6rem",
            height: "6rem",
            objectFit: "cover",
            transition: "0.1s transform ease-out",
            borderRadius: "0.2rem",
            [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
              width: "10rem",
              height: "10rem",
            },
          },
        })
      }
      onClick={onClick}
      disabled={disabled}
      data-selected={currentVote === vote}
    >
      <img alt={label} key={gifUrl} src={gifUrl} />
      <div className="label">{symbol}</div>
      <div className="hint" style={{ opacity: disabled ? 0 : 1 }}>
        {label}
      </div>
    </button>
  );
};

const ScreenHeader = ({ children }) => (
  <div
    css={css({
      fontSize: "1rem",
      display: "flex",
      alignItems: "center",
      padding: "0 1.5rem",
      whiteSpace: "nowrap",
      [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
        padding: "0 2rem",
        minHeight: "6rem",
      },
    })}
  >
    {children}
  </div>
);

const AuctionScreenHeader = ({
  auction,
  auctionEnded,
  // nounIdsByHolderAddresses,
  toggleBidsDialog,
  // auctionActionButtonElement,
  navigationElement,
}) => {
  const [isTimer, setIsTimer] = React.useState(true);
  const toggleTimer = () => setIsTimer((s) => !s);

  const { ensName: ownerENSName } = useProfile(auction?.noun.ownerAddress);
  const { ensName: bidderENSName } = useProfile(auction?.bidderAddress);
  const bidderShort =
    auction?.bidderAddress == null
      ? null
      : bidderENSName ?? shortenAddress(auction.bidderAddress);

  // const bidderHasNouns =
  //   auction != null &&
  //   (
  //     nounIdsByHolderAddresses[
  //       (auction.settled
  //         ? auction.noun.ownerAddress
  //         : auction.bidderAddress
  //       ).toLowerCase()
  //     ] ?? []
  //   ).length !== 0;

  // const bidderLinkContent = auction != null && (
  //   <>
  //     <Label>{auctionEnded ? "Winner" : "High-Bidder"}</Label>
  //     <Heading2 data-address>
  //       {auction.settled
  //         ? ownerENSName || shortenAddress(auction.noun.ownerAddress)
  //         : auctionEnded
  //         ? auction.amount.isZero()
  //           ? "-"
  //           : bidderShort
  //         : auction.amount.isZero()
  //         ? "No bids"
  //         : bidderShort}
  //     </Heading2>
  //   </>
  // );

  return (
    <ScreenHeader>
      <div
        css={css({
          display: "flex",
          alignItems: "center",
          paddingRight: "2rem",
          [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
            flex: "1 1 auto",
          },
        })}
      >
        <div css={css({ padding: "2rem 0" })}>{navigationElement}</div>
        {auction?.noun != null && (
          <div
            css={(theme) =>
              css({
                display: "none",
                [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
                  fontFamily: theme.fontStacks.headers,
                  display: "block",
                  textTransform: "uppercase",
                  fontSize: "3.6rem",
                  fontWeight: "600",
                  marginLeft: "1.5rem",
                  color: theme.colors.textHeader,
                },
              })
            }
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
          css={(theme) =>
            css({
              display: "grid",
              gridAutoFlow: "column",
              gridAutoColumns: "auto",
              alignItems: "center",
              gridGap: "3rem",
              "& > *": {
                minWidth: 0,
                overflow: "hidden",
              },
              a: { display: "block" },
              "@media (hover: hover)": {
                "a, button": {
                  ":hover [data-underline]": {
                    textDecoration: "underline",
                  },
                  ":hover [data-dim]": {
                    color: theme.colors.textDimmed,
                  },
                },
              },
            })
          }
        >
          <a
            href={`https://etherscan.io/address/${
              auction?.settled
                ? auction?.noun.ownerAddress
                : auction?.bidderAddress
            }`}
            target="_blank"
            rel="noreferrer"
          >
            <Label>{auctionEnded ? "Winner" : "High-Bidder"}</Label>
            <Heading2 data-address data-underline data-dim>
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
          </a>
          <button
            onClick={toggleBidsDialog}
            style={{
              background: "none",
              border: 0,
              padding: 0,
              cursor: "pointer",
            }}
          >
            {auction?.amount != null && (
              <>
                <Label>{auctionEnded ? "Winning bid" : "Current bid"}</Label>
                <Heading2 data-dim>
                  {auction.amount.isZero() ? (
                    "-"
                  ) : (
                    <>
                      <HeadingEthSymbol /> {formatEther(auction.amount)}
                    </>
                  )}
                </Heading2>
              </>
            )}
          </button>
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
              <Heading2 data-dim>
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

      {/* <div */}
      {/*   css={css({ */}
      {/*     display: "none", */}
      {/*     [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: { */}
      {/*       display: "block", */}
      {/*       marginLeft: "1.5rem", */}
      {/*     }, */}
      {/*   })} */}
      {/* > */}
      {/*   {auctionActionButtonElement} */}
      {/* </div> */}
    </ScreenHeader>
  );
};

const HeaderNounNavigation = ({
  auctionNounId,
  prevNounId,
  nextNounId,
  ...props
}) => (
  <div
    css={css({
      display: "grid",
      gridAutoColumns: "auto",
      gridAutoFlow: "column",
      alignItems: "center",
      gridGap: "0.5rem",
    })}
    {...props}
  >
    <Link href={`/nouns/${prevNounId}`}>
      <Button
        size="default"
        component="a"
        disabled={prevNounId < 0}
        css={css({
          height: "3rem",
          width: "3rem",
          minHeight: 0,
          "&[disabled]": { pointerEvents: "none" },
        })}
      >
        &larr;
      </Button>
    </Link>
    <Link href={nextNounId === auctionNounId ? "/" : `/nouns/${nextNounId}`}>
      <Button
        size="default"
        component="a"
        disabled={nextNounId > auctionNounId}
        css={css({
          height: "3rem",
          width: "3rem",
          minHeight: 0,
          "&[disabled]": { pointerEvents: "none" },
        })}
      >
        &rarr;
      </Button>
    </Link>
  </div>
);

const NounScreenHeader = ({ noun, navigationElement }) => {
  const { ensName: ownerENSName } = useProfile(noun.owner.address);
  const ownerName = ownerENSName ?? shortenAddress(noun.owner.address);

  return (
    <ScreenHeader>
      <div
        css={css({
          flex: "1 1 auto",
          paddingRight: "2rem",
          display: "flex",
          alignItems: "center",
        })}
      >
        <div css={css({ padding: "2rem 0" })}>{navigationElement}</div>
        <div
          css={(theme) =>
            css({
              fontFamily: theme.fontStacks.headers,
              marginLeft: "1rem",
              fontSize: "3rem",
              fontWeight: "600",
              textTransform: "uppercase",
              color: theme.colors.textHeader,
              [`@media (min-width: ${STACKED_MODE_BREAKPOINT})`]: {
                marginLeft: "1.5rem",
                fontSize: "3.6rem",
              },
            })
          }
        >
          Noun {noun.id}
        </div>
      </div>
      <div
        css={css({
          display: "grid",
          gridAutoFlow: "column",
          gridAutoColumns: "auto",
          alignItems: "center",
          gridGap: "2em",
          "& > *": {
            minWidth: 0,
            overflow: "hidden",
          },
        })}
      >
        <div>
          <Label>Winning bid</Label>
          <Heading2>
            {noun.auction == null ? (
              "-"
            ) : (
              <>
                <HeadingEthSymbol /> {formatEther(noun.auction.amount)}
              </>
            )}
          </Heading2>
        </div>
        <Link href={`/holders/${noun.owner.address}`}>
          <a
            css={css({
              cursor: "pointer",
              display: "block",
              "@media (hover: hover)": {
                ":hover [data-address]": {
                  textDecoration: "underline",
                  color: "hsl(0 0% 25%)",
                },
              },
            })}
          >
            <Label>Holder</Label>
            <Heading2 data-address>{ownerName}</Heading2>
          </a>
        </Link>
      </div>
    </ScreenHeader>
  );
};

export const Label = (props) => (
  <div
    css={(theme) =>
      css({
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        fontSize: "1.2rem",
        lineHeight: 1.2,
        color: theme.colors.textDimmed,
      })
    }
    {...props}
  />
);

export const Heading2 = (props) => (
  <div
    css={(theme) =>
      css({
        fontFamily: theme.fontStacks.headers,
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        fontSize: "2.4rem",
        lineHeight: 1.2,
        fontWeight: "600",
        color: theme.colors.textHeader,
      })
    }
    {...props}
  />
);

const NounTraitLabel = ({ highlight = false, name, title, stats }) => {
  return (
    <div
      css={css({
        display: "grid",
        alignItems: "flex-start",
        gridTemplateColumns: "auto minmax(0,1fr)",
        gridGap: "0.4rem",
        width: "max-content",
        padding: "0 0.4rem",
        fontSize: "1.2rem",
        fontWeight: "500",
        borderRadius: "0.3rem",
        cursor: "default",
        background: highlight ? highlightGradient : "white",
        backgroundSize: "600%",
        animation: `${highlightGradientAnimation} 25s linear infinite`,
        border: highlight ? "1px solid rgb(0 0 0 / 35%)" : undefined,
        boxShadow: "2px 2px 0 0 rgb(0 0 0 / 10%)",
      })}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          css={css({
            marginRight: "0.4rem",
            svg: {
              display: "block",
              padding: "0.4rem 0",
              width: "1.2rem",
              height: "auto",
            },
          })}
        >
          {iconByPartName[name]}
        </div>
        <div style={{ padding: "0.2rem 0" }}>
          {title} <span style={{ color: "rgb(0 0 0 / 54%)" }}>{name}</span>
          {stats != null && (
            <>
              {" "}
              <span
                style={{
                  fontSize: "1rem",
                  fontWeight: "500",
                  color: highlight ? "currentcolor" : "hsl(0 0% 36%)",
                }}
              >
                ({stats.count}/{stats.total})
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const BidsDialog = ({
  isOpen,
  onRequestClose,
  bids,
  nounIdsByHolderAddresses,
}) => {
  const count = bids?.length;
  return (
    <DarkDialog
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{ display: "flex", flexDirection: "column" }}
    >
      {({ titleProps }) => (
        <>
          <div
            css={css({
              display: "grid",
              gridAutoColumns: "auto",
              gridAutoFlow: "column",
              gridGap: "1rem",
              alignItems: "flex-end",
              justifyContent: "flex-start",
              padding: "1.5rem 1.5rem 1rem",
              "@media (min-width: 600px)": {
                padding: "2rem 2rem 1.5rem",
              },
            })}
          >
            <h1
              {...titleProps}
              css={css({
                fontSize: "1.8rem",
                lineHeight: "1.2",
                margin: 0,
              })}
            >
              Auction bids
            </h1>
            {count !== 0 && (
              <div
                css={(theme) =>
                  css({
                    color: theme.colors.textDimmed,
                    fontSize: "1.1rem",
                    transform: "translateY(-0.2rem)",
                  })
                }
              >
                {count} {count === 1 ? "bid" : "bids"}
              </div>
            )}
          </div>
          <div
            css={css({
              flex: "1 1 auto",
              overflow: "auto",
              padding: "0.5rem 1.5rem 1.5rem",
              "@media (min-width: 600px)": {
                padding: "0.5rem 2rem 2rem",
              },
            })}
          >
            {count === 0 ? (
              <div
                css={(theme) =>
                  css({
                    color: theme.colors.textDimmed,
                    textAlign: "center",
                    padding: "4rem 0",
                  })
                }
              >
                No bids
              </div>
            ) : (
              <ul
                css={css({
                  margin: 0,
                  padding: 0,
                })}
              >
                {bids
                  ?.sort((a, b) => b.blockTimestamp - a.blockTimestamp)
                  .map((b) => (
                    <li
                      key={b.id}
                      css={css({
                        display: "block",
                        ":not(:first-of-type)": { marginTop: "1.5rem" },
                      })}
                    >
                      <BidListItem
                        bid={b}
                        bidderNounIds={
                          nounIdsByHolderAddresses[
                            b.bidder.address.toLowerCase()
                          ] ?? []
                        }
                      />
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </>
      )}
    </DarkDialog>
  );
};

const BidListItem = ({ bid, bidderNounIds }) => {
  const { ensName, avatarURI, balance } = useProfile(
    bid.bidder.address,
    bid.blockNumber
  );

  const hasNouns = bidderNounIds.length !== 0;

  const bidderLinkContent = (
    <>
      {avatarURI != null ? (
        <img
          src={avatarURI}
          alt="ENS Avatar"
          css={(theme) =>
            css({
              display: "block",
              width: "4rem",
              height: "4rem",
              borderRadius: "0.3rem",
              objectFit: "cover",
              background: theme.colors.avatarBackground,
              overflow: "hidden",
            })
          }
        />
      ) : (
        <div
          css={(theme) =>
            css({
              width: "4rem",
              height: "4rem",
              borderRadius: "0.3rem",
              background: theme.colors.avatarBackground,
            })
          }
        />
      )}
      <div>
        <div
          css={(theme) =>
            css({
              display: "block",
              fontSize: "1.4rem",
              fontWeight: "500",
              overflow: "hidden",
              textOverflow: "ellipsis",
              color: theme.colors.textNormal,
            })
          }
        >
          <span className="bidder">
            {ensName ?? shortenAddress(bid.bidder.address)}
          </span>
          {ensName != null && (
            <span
              css={(theme) =>
                css({
                  fontSize: "1.1rem",
                  color: theme.colors.textDimmed,
                  marginLeft: "0.5rem",
                })
              }
            >
              {shortenAddress(bid.bidder.address)}
            </span>
          )}
        </div>
        <div
          css={(theme) =>
            css({
              fontSize: "1.1rem",
              color: theme.colors.textDimmed,
            })
          }
        >
          {balance == null
            ? "?"
            : `Ξ ${parseFloat(formatEther(balance)).toFixed(2)} left in wallet`}
          {bidderNounIds.length !== 0 && (
            <span style={{ marginLeft: "0.8rem" }}>
              {bidderNounIds.length}{" "}
              {bidderNounIds.length === 1 ? "noun" : "nouns"}
            </span>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div
      css={css({
        position: "relative",
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) auto",
        gridGap: "1.5rem",
        alignItems: "center",
        lineHeight: "1.4",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        a: {
          display: "grid",
          gridTemplateColumns: "auto minmax(0,1fr)",
          gridGap: "1.5rem",
          alignItems: "center",
          cursor: "pointer",
          "@media (hover: hover)": {
            ":hover .bidder": {
              textDecoration: "underline",
            },
          },
        },
      })}
    >
      {hasNouns ? (
        <Link href={`/holders/${bid.bidder.address}`}>
          <a>{bidderLinkContent}</a>
        </Link>
      ) : (
        <a
          href={`https://etherscan.io/address/${bid.bidder.address}`}
          target="_blank"
          rel="noreferrer"
        >
          {bidderLinkContent}
        </a>
      )}

      <a
        href={getEtherscanLink("tx", bid.transactionHash ?? bid.id)}
        target="_blank"
        rel="noreferrer"
        css={(theme) =>
          css({
            fontSize: "1.5rem",
            fontWeight: "500",
            color: theme.colors.textNormal,
            ":hover": { textDecoration: "underline" },
          })
        }
      >
        {"Ξ"} {formatEther(bid.amount)}
      </a>
    </div>
  );
};

const TraitDialog = ({ isOpen, onRequestClose, traitName, noun, nouns }) => {
  const traitValue = noun?.seed[traitName];

  const traitHumanReadableName = React.useMemo(() => {
    if (noun == null) return null;
    const part = noun.parts.find((p) => {
      const name = p.filename.split("-")[0];
      return name === traitName;
    });

    return part?.filename.split("-").slice(1).join(" ");
  }, [noun, traitName]);

  const traitNouns = React.useMemo(() => {
    const nounsByTraits = groupBy(
      (noun) =>
        ["head", "glasses", "body", "accessory"].map((partName) =>
          [partName, noun.seed[partName]].join("-")
        ),
      nouns
    );
    const trait = [traitName, traitValue].join("-");
    return nounsByTraits[trait] ?? [];
  }, [nouns, traitName, traitValue]);

  const nounCount = traitNouns.length;

  return (
    <DarkDialog
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{ display: "flex", flexDirection: "column" }}
    >
      {({ titleProps }) => (
        <>
          <div
            css={css({
              display: "grid",
              gridTemplateColumns: "auto auto",
              gridGap: "1rem",
              alignItems: "flex-end",
              justifyContent: "flex-start",
              padding: "1.5rem 1.5rem 1rem",
              "@media (min-width: 600px)": {
                padding: "2rem 2rem 1.5rem",
              },
            })}
          >
            <h1
              {...titleProps}
              css={css({
                fontSize: "1.8rem",
                lineHeight: "1.2",
                margin: 0,
              })}
            >
              <span style={{ textTransform: "capitalize" }}>
                {traitHumanReadableName}
              </span>{" "}
              {traitName}
            </h1>
            <div
              css={css({
                color: "hsl(0 0% 56%)",
                fontSize: "1.1rem",
                transform: "translateY(-0.2rem)",
              })}
            >
              {nounCount} {nounCount === 1 ? "noun" : "nouns"}
            </div>
          </div>
          <div
            css={css({
              flex: "1 1 auto",
              overflow: "auto",
              padding: "0.5rem 1.5rem 1.5rem",
              "@media (min-width: 600px)": {
                padding: "0.5rem 2rem 2rem",
              },
            })}
          >
            <ul
              css={css({
                margin: 0,
                padding: 0,
                display: "grid",
                gridGap: "1.5rem",
                gridTemplateColumns: "repeat(2, minmax(0,1fr))",
              })}
            >
              {traitNouns
                ?.sort((n1, n2) => {
                  const [i1, i2] = [n1, n2].map((n) => Number(n.id));
                  if (i1 > i2) return 1;
                  if (i1 < i2) return -1;
                  return 0;
                })
                .map((n) => (
                  <li key={n.id} css={css({ display: "block" })}>
                    <TraitNounListItem noun={n} />
                  </li>
                ))}
            </ul>
          </div>
        </>
      )}
    </DarkDialog>
  );
};

const TraitNounListItem = ({ noun: n }) => {
  const { data: ensName } = useEnsName({ address: n.owner.address });
  const ownerString = ensName ?? shortenAddress(n.owner.address);
  return (
    <div
      css={css({
        position: "relative",
        a: { outline: "none" },
        ".hover-link": { display: "none" },
        "@media (hover: hover)": {
          ".hover-link": { display: "block", opacity: 0 },
          ":hover .hover-link": { opacity: 1 },
        },
      })}
    >
      <Link href={`/nouns/${n.id}`}>
        <a
          style={{
            cursor: "pointer",
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
          css={css({
            "@media (hover: hover)": {
              "& + * .avatar": { transition: "0.05s transform ease-out" },
              ":hover + * .noun-link": { textDecoration: "underline" },
              ":hover + * .avatar": { transform: "scale(1.1)" },
            },
          })}
        />
      </Link>

      <div
        css={css({
          position: "relative",
          pointerEvents: "none",
          display: "grid",
          gridTemplateColumns: "auto minmax(0,1fr)",
          gridGap: "1.5rem",
          alignItems: "center",
          lineHeight: "1.4",
          whiteSpace: "nowrap",
          a: {
            pointerEvents: "all",
            display: "block",
            width: "max-content",
            fontSize: "1.1rem",
            color: "hsl(0 0% 56%)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            "@media (hover: hover)": {
              transition: "0.05s color ease-out",
              ":hover": {
                color: "hsl(0 0% 70%)",
                textDecoration: "underline",
              },
            },
          },
        })}
      >
        <img
          className="avatar"
          src={n.imageUrl}
          alt={`Noun ${n.id}`}
          css={css({
            display: "block",
            width: "4rem",
            borderRadius: "0.3rem",
          })}
        />

        <div>
          <div
            className="noun-link"
            css={css({
              display: "block",
              fontSize: "1.4rem",
              fontWeight: "500",
              overflow: "hidden",
              textOverflow: "ellipsis",
            })}
          >
            Noun {n.id}
          </div>
          <div css={css({ display: "flex", alignItems: "center" })}>
            <Link href={`/holders/${n.owner.address}`}>
              <a css={css({ cursor: "pointer", paddingRight: "0.2rem" })}>
                {ownerString}
              </a>
            </Link>
            <a
              href={`https://rainbow.me/${n.owner.address}`}
              target="_blank"
              rel="noreferrer"
              className="hover-link"
              css={css({
                padding: "0 0.3rem",
                transition: "0.1s transform ease-out",
                ":hover": { transform: "scale(1.2)" },
              })}
            >
              <img
                src="/rainbow-icon.png"
                alt="Rainbow icon"
                css={css({ display: "block", width: "1.5rem" })}
              />
            </a>
            <a
              href={`https://etherscan.io/address/${n.owner.address}`}
              target="_blank"
              rel="noreferrer"
              className="hover-link"
              css={css({
                padding: "0 0.3rem",
                transition: "0.1s transform ease-out",
                ":hover": { transform: "scale(1.2)" },
              })}
            >
              <img
                src="/etherscan-icon-light.png"
                alt="Etherscan icon"
                css={css({ display: "block", width: "1.4rem" })}
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const DarkDialog = ({ isOpen, onRequestClose, children, style, ...props }) => {
  const theme = useTheme();
  return (
    <Dialog
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{
        padding: 0,
        maxWidth: "48rem",
        color: theme.colors.textNormal,
        background: theme.colors.dialogBackground,
        ...style,
      }}
      {...props}
    >
      {children}
    </Dialog>
  );
};

const FloatingNounTraitLabel = ({
  component: Component = "div",
  highlight = false,
  name,
  title,
  stats,
  ...props
}) => {
  return (
    <Component
      data-noun-trait
      css={(theme) =>
        css({
          font: "inherit",
          position: "absolute",
          width: "max-content",
          padding: "0.7rem 0.9rem 0.7rem 0.7rem",
          fontSize: "1.4rem",
          fontWeight: "500",
          borderRadius: "0.3rem",
          transform: "translateY(-50%) translateX(-1rem)",
          zIndex: 2,
          color: highlight ? "black" : theme.colors.textNormal,
          background: highlight
            ? highlightGradient
            : theme.colors.dialogBackground,
          backgroundSize: "600%",
          animation: `${highlightGradientAnimation} 25s linear infinite`,
          border: highlight ? "1px solid rgb(0 0 0 / 35%)" : "none",
          boxShadow: theme.shadows.elevationLow, // "2px 2px 0 0 rgb(0 0 0 / 10%)",
          lineHeight: 1.2,
          ...positionByPartName[name],
        })
      }
      {...props}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <div css={css({ marginRight: "0.5rem", svg: { display: "block" } })}>
          {iconByPartName[name]}
        </div>
        {title}
      </div>
      {stats != null && (
        <div
          css={(theme) =>
            css({
              display: "flex",
              alignItems: "center",
              fontSize: theme.fontSizes.small,
              fontWeight: "400",
              color: highlight ? "currentcolor" : theme.colors.textDimmed,
              margin: "0.3rem 0 0",
            })
          }
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
                  fill="currentColor"
                  stroke="currentColor"
                  // fill="#FFC110"
                  // stroke="#FFC110"
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
    </Component>
  );
};

// const Button = ({
//   component: Component = "button",
//   hint,
//   isLoading = false,
//   children,
//   ...props
// }) => (
//   <Component
//     css={css({
//       display: "inline-flex",
//       alignItems: "center",
//       justifyContent: "center",
//       height: "4rem",
//       background: "white",
//       border: 0,
//       borderRadius: "0.5rem",
//       fontSize: "1.5rem",
//       fontWeight: "600",
//       fontFamily: "inherit",
//       padding: "0 1.5rem",
//       outline: "none",
//       maxWidth: "100%",
//       background: "#667AF9",
//       color: "white",
//       cursor: "pointer",
//       transition: "0.1s all easy-out",
//       textAlign: "left",
//       ":disabled": {
//         opacity: "0.8",
//         color: "hsl(0 0% 100% / 80%)",
//         pointerEvents: "none",
//       },
//       "@media (hover: hover)": {
//         ":hover": {
//           filter: "brightness(1.03) saturate(1.2)",
//         },
//       },
//     })}
//     {...props}
//   >
//     <div>
//       {children}
//       {hint != null && (
//         <div css={css({ fontSize: "1rem", fontWeight: "500" })}>{hint}</div>
//       )}
//     </div>
//     {isLoading && <Spinner size="1.5rem" style={{ marginLeft: "1rem" }} />}
//   </Component>
// );

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

const GrayButton = React.forwardRef(function GrayButton_(
  {
    component: Component = "button",
    isLoading,
    error,
    hint,
    disabled,
    children,
    ...props
  },
  ref
) {
  let disabledProps;
  if (disabled)
    disabledProps =
      Component === "button" ? { disabled } : { "data-disabled": true };

  return (
    <Component
      ref={ref}
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
        ":disabled, &[data-disabled]": {
          cursor: "not-allowed",
          pointerEvents: "none",
          borderColor: "hsl(0 0% 65%)",
          color: "hsl(0 0% 46%)",
        },
        "@media (hover: hover)": {
          ":hover": {
            background: "hsl(0 0% 80%)",
          },
        },
      })}
      {...disabledProps}
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
});

const ProgressBar = ({ disabled, progress = 0, height = "1rem" }) => (
  <div
    css={(theme) =>
      css({
        height,
        width: "100%",
        borderRadius: "0.5rem",
        background: rainbowGradient,
        animation: `${progressGradientAnimation} 6s linear infinite`,
        backgroundSize: "200%",
        position: "relative",
        overflow: "hidden",
        filter: disabled ? "saturate(0)" : undefined,
        border: disabled
          ? theme.light
            ? "1px solid hsl(0 0% 50%)"
            : "1px solid hsl(0 0% 25%)"
          : "1px solid rgb(0 0 0 / 40%)",
      })
    }
  >
    <div
      css={(theme) =>
        css({
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          opacity: 0.9,
          width: `min(calc(100% - 0px),${(1 - progress) * 100}%)`,
          transition: "0.2s width ease-out, 0.2s background ease-out",
          background: theme.light
            ? disabled
              ? "rgb(150 150 150)"
              : "rgb(100 100 100)"
            : theme.colors.backgroundPrimary,
        })
      }
    />
  </div>
);

const Emoji = ({ style, ...props }) => (
  <span
    style={{
      display: "inline-flex",
      transform: "scale(1.2)",
      margin: "0 0.2rem",
      ...style,
    }}
    {...props}
  />
);

const HeadingEthSymbol = () => (
  <span
    css={(theme) =>
      css({
        fontFamily: theme.fontStacks.default,
        fontSize: "0.9em",
        fontWeight: "800",
      })
    }
  >
    {"Ξ"}
  </span>
);
