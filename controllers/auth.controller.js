import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { generateAccessToken , generateRefreshToken , storeRefreshToken , deleteRefreshToken , blacklistToken , verifyRefreshToken , getRefreshToken, verifyAccessToken} from "../configs/jwt.js";
import { isRedisAvailable } from "../configs/redis.js";
import { User } from "../models/user.models.js";


export var login = asyncHandler(async (req , res) => {
    var {email , password} = req.body;
    
    if(!email || !password){
        throw ApiError.badRequest("Email and password are required");
    }
    var user = await User.findOne({email});
    if(!user){
        throw ApiError.badRequest("Invalid email or password");
    }
    var isPasswordCorrect = await user.isPasswordCorrect(password);
    if(!isPasswordCorrect){
        throw ApiError.badRequest("Invalid email or password");
    }

    var accessToken = generateAccessToken(user._id);
    var refreshToken = generateRefreshToken(user._id);

    // Store new refresh token first to avoid race condition
    // If store fails, old token remains valid
    await storeRefreshToken(user._id , refreshToken);

    const loggedInUser = await User.findById(user._id).select('-password -refreshToken');

    return ApiResponse.success(res , "Login successful" , {
        user : loggedInUser,
        accessToken,
        refreshToken
    })
})

export const signup = asyncHandler(async (req, res) => {
  const { name , email, password } = req.body;

  // Validate input
  if (!email || !password) {
    throw ApiError.badRequest('Email and password are required');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.badRequest('User with this email already exists');
  }

  // Create user (password will be hashed by pre-save hook)
  const user = await User.create({ name , email, password });

  // Get user without password
  const createdUser = await User.findById(user._id).select('-password -refreshToken');

  return ApiResponse.success(res, 'User registered successfully', { 
    user: createdUser 
  });
});

export const refresh = asyncHandler(async (req , res) => {
  var refreshToken = req.body?.refreshToken || req.headers.authorization;
  if (typeof refreshToken === 'string') {
    refreshToken = refreshToken.replace(/^Bearer\s+/i, '').trim();
  }

  if(!refreshToken){
    throw ApiError.badRequest("Refresh token is required");
  }

  var decoded = verifyRefreshToken(refreshToken);
  if(!decoded){
    throw ApiError.badRequest("Invalid refresh token");
  }

  if (isRedisAvailable()) {
    var storedRefreshToken = await getRefreshToken(decoded.userId);
    if(!storedRefreshToken){
      throw ApiError.badRequest("Session expired. Please login again");
    }

    if(storedRefreshToken.trim() !== refreshToken){
      throw ApiError.badRequest("Refresh token does not match latest login session");
    }
  }

  var newAccessToken = generateAccessToken(decoded.userId);
   return ApiResponse.success(res , "Token refreshed successfully" , {
    accessToken : newAccessToken
   });
})

export const logout = asyncHandler(async (req , res) => {
  // Token already verified by authenticate middleware
  // req.user contains the userId from the verified token
  var token = req.headers.authorization?.split(" ")[1];
  
  if(!token){
    throw ApiError.badRequest("Authorization token is required");
  }

  // Calculate token expiry for blacklisting
  var decoded = verifyAccessToken(token);
  var accessTokenExpiry = Math.floor((decoded.exp * 1000 - Date.now()) / 1000);

  if (isRedisAvailable()) {
    // Blacklist access token
    await blacklistToken(token , accessTokenExpiry);

    // Delete refresh token using userId from middleware
    await deleteRefreshToken(req.user._id);
  }

  return ApiResponse.success(res , "Logged out successfully");
})