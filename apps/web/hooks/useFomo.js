import React from "react";
import { useProvider, useNetwork } from "wagmi";
import { getNounData, getNounSeedFromBlockHash } from "@nouns/assets";
import { ALCHEMY_API_KEY } from "../utils/network";
import { getImageUrlFromSeed as getNounImageUrl } from "../utils/nouns";

const useNewHeadsSocket = (listener) => {
  const network = useNetwork();
  const alchemyRpcUrl = network.chain?.rpcUrls.alchemy;

  const listenerRef = React.useRef();

  const [isConnected, setConnected] = React.useState(false);

  React.useLayoutEffect(() => {
    listenerRef.current = listener;
  });

  React.useEffect(() => {
    if (alchemyRpcUrl == null) return;

    const url = new URL(alchemyRpcUrl);

    const requestId = 1;
    let subscriptionId = null;

    const socket = new WebSocket(
      `wss://${url.hostname}${url.pathname}/${ALCHEMY_API_KEY}`
    );

    socket.addEventListener("open", () => {
      socket.send(
        JSON.stringify({
          jsonrpc: "2.0",
          id: requestId,
          method: "eth_subscribe",
          params: ["newHeads"],
        })
      );
    });
    socket.addEventListener("message", (message) => {
      try {
        const data = JSON.parse(message.data);
        if (data.id === requestId) {
          subscriptionId = data.result;
          setConnected(true);
        }
        if (data.params?.subscription === subscriptionId)
          listenerRef.current(data.params.result);
      } catch (e) {
        console.error(e);
      }
    });
    socket.addEventListener("error", () => {
      socket.close();
    });
    socket.addEventListener("close", () => {
      setConnected(false);
    });

    return () => {
      socket.close();
    };
  }, [alchemyRpcUrl]);

  return { isConnected };
};

let voteSocket = null;

const useVoting = ({ auction }) => {
  const provider = useProvider();

  const [latestBlock, setLatestBlock] = React.useState(null);
  const [votesByBlockNumber, setVotesByBlockNumber] = React.useState({});
  const [isVotingActive, setVotingActive] = React.useState(false);
  const [score, setScore] = React.useState(0);
  const [settlementAttempted, setSettlementAttempted] = React.useState(false);
  const [isConnectedToVotingSocket, setConnectedToVotingSocket] =
    React.useState(false);
  const [voteCounts, setVoteCount] = React.useState({ like: 0, dislike: 0 });

  const reset = () => {
    setScore(0);
    setVotingActive(true);
    setSettlementAttempted(false);
    setVoteCount({ like: 0, dislike: 0 });
  };

  const { isConnected: isConnectedToBlockSocket } = useNewHeadsSocket(
    (block) => {
      // Ignore chain reorgs
      if (Number(block.number) < Number(latestBlock.number)) return;

      reset();
      setLatestBlock({ ...block, localTimestamp: new Date().getTime() });

      window.setTimeout(() => {
        setVotingActive(false);
      }, 6000);
    }
  );

  React.useEffect(() => {
    if (latestBlock != null) return;
    provider.getBlock("latest").then((b) => {
      setLatestBlock(b);
    });
  }, [provider, latestBlock]);

  React.useEffect(() => {
    voteSocket = new WebSocket(process.env.NEXT_PUBLIC_VOTING_SOCKET);

    voteSocket.addEventListener("message", (message) => {
      try {
        const data = JSON.parse(String(message.data));
        console.log("vote socket message", data);
        if (data.vote) {
          if (data.vote === "voteLike")
            setVoteCount((cs) => ({ ...cs, like: cs.like + 1 }));
          if (data.vote === "voteDislike")
            setVoteCount((cs) => ({ ...cs, dislike: cs.dislike + 1 }));
        }
        if ("score" in data) {
          setScore(data.score);
        }
        if (data.settlementAttempted) {
          setSettlementAttempted(true);
          // store.dispatch(setAttemptedSettleBlockHash(data.blockhash));
        }
        // if ("connections" in data) {
        //   store.dispatch(setNumConnections(data.connections));
        // }
        // if ("activeVoters" in data) {
        //   store.dispatch(setActiveVoters(data.activeVoters));
        // }
      } catch (err) {
        console.error(err);
      }
    });

    voteSocket.addEventListener("open", () => {
      setConnectedToVotingSocket(true);
    });

    voteSocket.addEventListener("error", () => {
      voteSocket.close();
    });
    voteSocket.addEventListener("close", () => {
      setConnectedToVotingSocket(false);
    });

    return () => {
      voteSocket.close();
    };
  }, []);

  const vote = ({ type }) => {
    if ([auction?.nounId, latestBlock?.hash, type].some((a) => a == null))
      throw new Error();

    setVotesByBlockNumber((vs) => ({
      ...vs,
      [Number(latestBlock.number)]: type,
    }));

    const voteStringByType = {
      like: "voteLike",
      dislike: "voteDislike",
      shrug: "voteShrug",
    };

    voteSocket.send(
      JSON.stringify({
        action: "sendvote",
        nounId: auction.nounId,
        blockhash: latestBlock.hash,
        vote: voteStringByType[type],
      })
    );
  };

  const like = () => vote({ type: "like" });
  const dislike = () => vote({ type: "dislike" });
  const shrug = () => vote({ type: "shrug" });

  const markInactive = () => {
    voteSocket.send(
      JSON.stringify({
        action: "changestatus",
        status: "inactive",
      })
    );
  };

  return {
    isConnected: isConnectedToBlockSocket && isConnectedToVotingSocket,
    reconnect: () => {
      window.reload();
    },
    isVotingActive,
    vote:
      latestBlock == null
        ? null
        : votesByBlockNumber[Number(latestBlock.number)],
    like,
    dislike,
    shrug,
    markInactive,
    score,
    settlementAttempted,
    block: latestBlock,
    voteCounts,
  };
};

const useFomo = ({ auction, enabled }) => {
  const { block, ...voting } = useVoting({ auction });

  const noun = React.useMemo(() => {
    if (!enabled || auction?.nounId == null || block?.hash == null) return null;

    const id = auction.nounId + 1;
    const seed = getNounSeedFromBlockHash(id, block.hash);
    const { parts, background } = getNounData(seed);
    const imageUrl = getNounImageUrl({ parts, background });
    return { id, parts, background, imageUrl };
  }, [enabled, auction?.nounId, block]);

  return {
    isActive: enabled,
    noun,
    block,
    ...voting,
  };
};

export default useFomo;
