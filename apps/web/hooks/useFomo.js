import React from "react";
import { useProvider, useNetwork } from "wagmi";
import { getNounSeedFromBlockHash } from "@nouns/assets";
import { ALCHEMY_API_KEY, chains } from "../utils/network";
import { enhance as enhanceNoun } from "../utils/nouns";
import { useLayoutEffect } from "../utils/react";

const useNewHeadsSocket = (listener) => {
  const network = useNetwork();
  const alchemyRpcUrl = (network.chain ?? chains[0]).rpcUrls.alchemy;

  const listenerRef = React.useRef();

  const [isConnected, setConnected] = React.useState(false);

  useLayoutEffect(() => {
    listenerRef.current = listener;
  });

  React.useEffect(() => {
    if (alchemyRpcUrl == null) return;

    const url = new URL(alchemyRpcUrl);

    const requestId = 1;
    let subscriptionId = null;

    let socket;

    const connect = () => {
      socket = new WebSocket(
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
    };

    connect();

    const focusHandler = () => {
      if (socket.readyState === "CLOSED") connect();
    };
    window.addEventListener("focus", focusHandler);

    return () => {
      socket.close();
      window.removeEventListener("focus", focusHandler);
    };
  }, [alchemyRpcUrl]);

  return { isConnected };
};

let voteSocket = null;

let votingTimerTimeoutHandle;

const useVoting = ({ auction, enabled }) => {
  const provider = useProvider();

  const [latestBlock, setLatestBlock] = React.useState(null);
  const [recentBlockHashes, setRecentBlockHashes] = React.useState([]);
  const [votesByBlockHash, setVotesByBlockHash] = React.useState({});
  const [isVotingActive, setVotingActive] = React.useState(false);
  const [score, setScore] = React.useState(0);
  const [settlementAttempted, setSettlementAttempted] = React.useState(false);
  const [isConnectedToVotingSocket, setConnectedToVotingSocket] =
    React.useState(false);
  const [voteCountsByBlockHash, setVoteCountsByBlockHash] = React.useState({});

  const reset = () => {
    setScore(0);
    setVotingActive(true);
    setSettlementAttempted(false);
  };

  const { isConnected: isConnectedToBlockSocket } = useNewHeadsSocket(
    (block) => {
      // Ignore chain reorgs
      if (
        latestBlock != null &&
        Number(block.number) < Number(latestBlock.number)
      )
        return;

      setLatestBlock({ ...block, localTimestamp: new Date().getTime() });

      if (!enabled) return;

      reset();
      setRecentBlockHashes((hashes) =>
        // No need to keep more than 3
        [...hashes, block.hash].slice(-3)
      );
      setVoteCountsByBlockHash((cs) => ({
        ...cs,
        [block.hash]: cs[block.hash] ?? { like: 0, dislike: 0 },
      }));

      // Reset the timer in case the previous one hasn’t finised
      if (votingTimerTimeoutHandle != null) {
        clearTimeout(votingTimerTimeoutHandle);
        votingTimerTimeoutHandle = null;
      }

      votingTimerTimeoutHandle = window.setTimeout(() => {
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
    const connect = () => {
      voteSocket = new WebSocket(process.env.NEXT_PUBLIC_VOTING_SOCKET);

      voteSocket.addEventListener("message", (message) => {
        try {
          const data = JSON.parse(String(message.data));
          console.log("vote socket message", data);
          if (data.vote) {
            setVoteCountsByBlockHash((cs) => {
              const counts = cs[data.blockhash] ?? { like: 0, dislike: 0 };
              const voteType = { voteLike: "like", voteDislike: "dislike" }[
                data.vote
              ];
              if (voteType == null) return cs;
              return {
                ...cs,
                [data.blockhash]: {
                  ...counts,
                  [voteType]: counts[voteType] + 1,
                },
              };
            });
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
    };

    const focusHandler = () => {
      if (voteSocket.readyState === "CLOSED") connect();
    };
    window.addEventListener("focus", focusHandler);

    connect();

    return () => {
      voteSocket.close();
      window.removeEventListener("focus", focusHandler);
    };
  }, []);

  const vote = ({ type }) => {
    if ([auction?.nounId, latestBlock?.hash, type].some((a) => a == null))
      throw new Error();

    setVotesByBlockHash((vs) => ({
      ...vs,
      [latestBlock.hash]: type,
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

  const isInactive =
    recentBlockHashes.length === 3 &&
    recentBlockHashes.every((h) => votesByBlockHash[h] == null);

  React.useEffect(() => {
    if (!isInactive) return;
    if (voteSocket.readyState !== "OPEN") return;
    voteSocket.send(
      JSON.stringify({ action: "changestatus", status: "inactive" })
    );
  }, [isInactive]);

  return {
    isConnected: isConnectedToBlockSocket && isConnectedToVotingSocket,
    reconnect: () => {
      window.reload();
    },
    isVotingActive,
    vote: latestBlock == null ? null : votesByBlockHash[latestBlock.hash],
    like,
    dislike,
    shrug,
    score,
    settlementAttempted,
    block: latestBlock,
    voteCounts:
      latestBlock == null
        ? null
        : voteCountsByBlockHash[latestBlock.hash] ?? {
            likes: 0,
            dislikes: 0,
          },
  };
};

const useFomo = ({ auction, enabled }) => {
  const { block, ...voting } = useVoting({
    auction,
    enabled,
  });

  const nounOrNouns = React.useMemo(() => {
    if (!enabled || auction?.nounId == null || block?.hash == null) return null;

    const buildNoun = (id, hash) => {
      const seed = getNounSeedFromBlockHash(id, hash);
      const noun = { id, seed };
      return enhanceNoun(noun);
    };

    const id = auction.nounId + 1;

    if (id <= 1820 && id % 10 === 0)
      return [buildNoun(id, block.hash), buildNoun(id + 1, block.hash)];

    return buildNoun(id, block.hash);
  }, [enabled, auction?.nounId, block]);

  const [noundersNoun, noun] = Array.isArray(nounOrNouns)
    ? nounOrNouns
    : [null, nounOrNouns];

  return {
    isActive: enabled,
    noun,
    noundersNoun,
    block,
    ...voting,
  };
};

export default useFomo;
