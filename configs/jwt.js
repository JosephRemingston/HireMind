import jwt from 'jsonwebtoken';
import redis, { connectRedis, isRedisAvailable } from './redis.js';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-access-secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret';
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

export const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY
  });
};

export const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY
  });
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
  } catch (error) {
    return null;
  }
};

const withRedisFallback = async (operation, fallbackValue) => {
  try {
    const connected = await connectRedis();
    if (!connected || !redis || !isRedisAvailable()) {
      return fallbackValue;
    }

    return await operation();
  } catch (error) {
    console.warn(`⚠ Redis operation skipped: ${error.message}`);
    return fallbackValue;
  }
};

// Store token in Redis with expiry (for blacklisting on logout)
export const storeTokenInRedis = async (userId, token, expiryInSeconds) => {
  const key = `user:${userId}:token`;
  await withRedisFallback(() => redis.setex(key, expiryInSeconds, token));
};

// Check if token is blacklisted
export const isTokenBlacklisted = async (token) => {
  const exists = await withRedisFallback(() => redis.get(`blacklist:${token}`), null);
  return !!exists;
};

// Blacklist token (for logout)
export const blacklistToken = async (token, expiryInSeconds) => {
  await withRedisFallback(() => redis.setex(`blacklist:${token}`, expiryInSeconds, 'true'));
};

// Store refresh token in Redis
export const storeRefreshToken = async (userId, refreshToken) => {
  const key = `refresh:${userId}`;
  // 7 days in seconds
  await withRedisFallback(() => redis.setex(key, 7 * 24 * 60 * 60, refreshToken));
};

// Get refresh token from Redis
export const getRefreshToken = async (userId) => {
  const key = `refresh:${userId}`;
  return await withRedisFallback(() => redis.get(key), null);
};

// Delete refresh token from Redis
export const deleteRefreshToken = async (userId) => {
  const key = `refresh:${userId}`;
  await withRedisFallback(() => redis.del(key));
};