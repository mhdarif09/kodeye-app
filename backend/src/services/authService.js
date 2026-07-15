const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const userQueries = require('../db/queries/userQueries');
const redisClient = require('../db/redis');
const config = require('../config/env');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const googleClient = new OAuth2Client(config.google.clientId);

const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role || 'user' };
  const accessToken = jwt.sign(payload, config.jwt.secret, { expiresIn: '24h' });
  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: '30d' });
  return { accessToken, refreshToken };
};

const register = async (email, password, displayName) => {
  const existingUser = await userQueries.findByEmail(email);
  if (existingUser) {
    throw new AppError('Email already in use', 400, 'EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const id = uuidv4();
  
  const user = await userQueries.createUser({
    id,
    email,
    password_hash: passwordHash,
    display_name: displayName,
  });

  logger.info(`User registered successfully: ${email}`);
  return user;
};

const login = async (email, password) => {
  const user = await userQueries.findByEmail(email);
  if (!user || !user.password_hash) {
    logger.warn(`Login failed: Invalid credentials for ${email}`);
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    logger.warn(`Login failed: Invalid credentials for ${email}`);
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const tokens = generateTokens(user);
  
  // Save refresh token to Redis with 30 days TTL (in seconds)
  const ttl = 30 * 24 * 60 * 60;
  await redisClient.set(`refresh:${user.id}`, tokens.refreshToken, 'EX', ttl);

  logger.info(`Login successful for ${email}`);
  return { user, ...tokens };
};

const loginWithGoogle = async (googleIdToken) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: googleIdToken,
      audience: config.google.clientId,
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name: displayName, picture: avatarUrl } = payload;

    let user = await userQueries.findByGoogleId(googleId);

    if (!user) {
      user = await userQueries.findByEmail(email);
      
      if (user) {
        user = await userQueries.updateUser(user.id, { google_id: googleId, avatar_url: avatarUrl });
        logger.info(`Google account linked to existing user: ${email}`);
      } else {
        const id = uuidv4();
        user = await userQueries.createUser({
          id,
          email,
          google_id: googleId,
          display_name: displayName,
          avatar_url: avatarUrl
        });
        logger.info(`New user registered via Google: ${email}`);
      }
    }

    const tokens = generateTokens(user);
    const ttl = 30 * 24 * 60 * 60;
    await redisClient.set(`refresh:${user.id}`, tokens.refreshToken, 'EX', ttl);

    logger.info(`Google login successful for ${email}`);
    return { user, ...tokens };

  } catch (error) {
    logger.error('Google token verification failed', error);
    throw new AppError('Invalid Google token', 401, 'INVALID_TOKEN');
  }
};

const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) throw new AppError('No refresh token provided', 401, 'UNAUTHORIZED');

  try {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    const storedToken = await redisClient.get(`refresh:${decoded.id}`);

    if (storedToken !== refreshToken) {
      throw new AppError('Invalid or expired refresh token', 401, 'UNAUTHORIZED');
    }

    const user = await userQueries.findById(decoded.id);
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    const tokens = generateTokens(user);
    const ttl = 30 * 24 * 60 * 60;
    await redisClient.set(`refresh:${user.id}`, tokens.refreshToken, 'EX', ttl);

    return tokens;
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401, 'UNAUTHORIZED');
  }
};

const logout = async (userId) => {
  await redisClient.del(`refresh:${userId}`);
  logger.info(`User logged out: ${userId}`);
};

const forgotPassword = async (email) => {
  const user = await userQueries.findByEmail(email);
  if (!user) {
    logger.warn(`Forgot password requested for non-existent email: ${email}`);
    return null;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const ttl = 60 * 60; // 1 hour
  await redisClient.set(`reset:${token}`, user.id, 'EX', ttl);

  logger.info(`Password reset token generated for ${email}`);
  return token;
};

const resetPassword = async (token, newPassword) => {
  const userId = await redisClient.get(`reset:${token}`);
  if (!userId) {
    throw new AppError('Invalid or expired reset token', 400, 'INVALID_TOKEN');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await userQueries.updateUser(userId, { password_hash: passwordHash });
  await redisClient.del(`reset:${token}`);

  logger.info(`Password reset successfully for user ID: ${userId}`);
};

module.exports = {
  register,
  login,
  loginWithGoogle,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
};
