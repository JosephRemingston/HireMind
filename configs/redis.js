import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config({ override: true });

let redisClient = null;

const getRedisUrl = () => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("REDIS_URL is not set");
  }

  return redisUrl;
};

export const connectRedis = async () => {
  try {
    redisClient = new Redis(getRedisUrl(), {
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    await redisClient.ping();

    console.log("✓ Redis connected");
    return redisClient;
  } catch (error) {
    console.warn("⚠ Redis connection failed:", error.message);
    console.warn("⚠ App will continue without Redis caching");
    redisClient = null;
    return null;
  }
};

export const isRedisAvailable = () => {
  return redisClient !== null && redisClient.status === 'ready';
};

export const getRedis = () => {
  if (!redisClient) {
    throw new Error("Redis is not initialized");
  }

  return redisClient;
};

export default redisClient;