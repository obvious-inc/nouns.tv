import type { NextApiRequest, NextApiResponse } from "next";
import redis from "../../lib/redis";

export const AUDIENCE_REDIS_KEY = "nouns:audience";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { sessionId } = req.body;
  if (req.method === "POST") {
    await redis.sadd(AUDIENCE_REDIS_KEY, sessionId);
    res.status(201);
  } else if (req.method === "GET") {
    await redis
      .smembers(AUDIENCE_REDIS_KEY)
      .then((members) => {
        res.status(200).json({ sessions: members.length });
      })
      .catch((error) => {
        res.status(400);
        console.error("error fetching audience", error);
      });
  } else if (req.method === "DELETE") {
    await redis.srem(AUDIENCE_REDIS_KEY, sessionId).then(() => {
      res.status(200);
    });
  } else {
    throw `unexpected method: ${req.method}`;
  }

  res.end();
}
