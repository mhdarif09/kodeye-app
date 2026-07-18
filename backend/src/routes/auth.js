const express = require('express');
const rateLimit = require('express-rate-limit');
const authService = require('../services/authService');
const validate = require('../middleware/validate');
const schemas = require('../validation/authSchemas');
const verifyJWT = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: {
      message: 'Too many authentication attempts, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  }
});

router.post('/register', validate(schemas.registerSchema), async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;
    const user = await authService.register(email, password, displayName);
    res.status(201).json({ message: 'Registration successful', user });
  } catch (error) {
    next(error);
  }
});

router.post('/login', authLimiter, validate(schemas.loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.login(email, password);
    res.status(200).json({ message: 'Login successful', user, accessToken, refreshToken });
  } catch (error) {
    next(error);
  }
});

router.post('/google', authLimiter, validate(schemas.googleAuthSchema), async (req, res, next) => {
  try {
    const { id_token } = req.body;
    const { user, accessToken, refreshToken } = await authService.loginWithGoogle(id_token);
    res.status(200).json({ message: 'Google login successful', user, accessToken, refreshToken });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', validate(schemas.refreshSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshAccessToken(refreshToken);
    res.status(200).json({ message: 'Token refreshed', ...tokens });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', verifyJWT, async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/forgot-password', authLimiter, validate(schemas.forgotPasswordSchema), async (req, res, next) => {
  try {
    const { email } = req.body;
    const token = await authService.forgotPassword(email);
    logger.info(`Password reset token for ${email}: ${token}`); // Dev logging only
    res.status(200).json({ message: 'Password reset instructions sent' });
  } catch (error) {
    next(error);
  }
});

router.post('/reset-password', authLimiter, validate(schemas.resetPasswordSchema), async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    await authService.resetPassword(token, newPassword);
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
