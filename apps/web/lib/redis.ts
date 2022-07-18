import Redis from "ioredis";

export const REDIS_URL = process.env.REDIS_URL as string;

const redis = new Redis(REDIS_URL);

export default redis;
