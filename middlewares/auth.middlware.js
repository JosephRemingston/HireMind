import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { verifyAccessToken, isTokenBlacklisted } from '../configs/jwt.js';
import { isRedisAvailable } from '../configs/redis.js';
import { User } from '../models/user.models.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    throw ApiError.badRequest('Access token is required');
  }

  // Check if token is blacklisted
  if (isRedisAvailable()) {
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      return ApiResponse.unauthorized(res, 'You have been logged out please login again');
    }
  }

  // Verify token
  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return ApiResponse.unauthorized(res, 'Invalid or expired token');
  }

  // Get user from database
  const user = await User.findById(decoded.userId).select('-password -refreshToken');
  if (!user) {
    return ApiResponse.badRequest(res, 'User not found');
  }

  req.user = user;
  next();
});