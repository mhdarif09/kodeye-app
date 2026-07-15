const express = require('express');
const userService = require('../services/userService');
const statsService = require('../services/statsService');
const validate = require('../middleware/validate');
const schemas = require('../validation/userSchemas');
const verifyJWT = require('../middleware/auth');

const router = express.Router();

router.use(verifyJWT);

router.get('/me', async (req, res, next) => {
  try {
    const profile = await userService.getProfile(req.user.id);
    res.status(200).json({ data: profile });
  } catch (error) {
    next(error);
  }
});

router.patch('/me', validate(schemas.updateProfileSchema), async (req, res, next) => {
  try {
    const updatedProfile = await userService.updateProfile(req.user.id, req.body);
    res.status(200).json({ data: updatedProfile });
  } catch (error) {
    next(error);
  }
});

router.post('/me/onboarding', validate(schemas.onboardingSchema), async (req, res, next) => {
  try {
    const { skillCategories, techStacks, experienceLevel } = req.body;
    const updatedProfile = await userService.completeOnboarding(req.user.id, { skillCategories, techStacks, experienceLevel });
    res.status(200).json({ data: updatedProfile });
  } catch (error) {
    next(error);
  }
});

router.delete('/me', async (req, res, next) => {
  try {
    await userService.deleteAccount(req.user.id);
    res.status(200).json({ data: { message: 'Account deleted successfully' } });
  } catch (error) {
    next(error);
  }
});

router.get('/me/stats', async (req, res, next) => {
  try {
    const stats = await statsService.getUserStats(req.user.id);
    res.status(200).json({ data: stats });
  } catch (error) {
    next(error);
  }
});

router.get('/me/history', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await statsService.getUserHistory(req.user.id, page, limit);
    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
