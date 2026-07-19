'use strict';

const express = require('express');
const matchmakingService = require('../services/matchmakingService');
const userQueries = require('../db/queries/userQueries');
const validate = require('../middleware/validate');
const verifyJWT = require('../middleware/auth');
const { joinQueueSchema } = require('../validation/matchmakingSchemas');
const AppError = require('../utils/AppError');

const router = express.Router();

// All matchmaking routes are protected
router.use(verifyJWT);

// POST /api/matchmaking/queue
router.post('/queue', validate(joinQueueSchema), async (req, res, next) => {
  try {
    const { mode, category, difficulty } = req.body;
    const userId = req.user.id;

    // Prevent duplicate queue entries
    const existing = await matchmakingService.getQueueStatus(userId);
    if (existing.inQueue) {
      return next(new AppError('You are already in a queue', 409, 'ALREADY_IN_QUEUE'));
    }

    const result = await matchmakingService.joinQueue(userId, mode, category, difficulty);
    res.status(200).json({
      data: {
        message: 'Joined matchmaking queue',
        queueKey: result.key,
        position: result.position,
      },
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/matchmaking/queue
router.delete('/queue', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const status = await matchmakingService.getQueueStatus(userId);
    if (!status.inQueue) {
      return next(new AppError('You are not in any queue', 404, 'NOT_IN_QUEUE'));
    }

    await matchmakingService.leaveQueue(
      userId,
      status.mode,
      status.category,
      status.difficulty
    );

    res.status(200).json({ data: { message: 'Left matchmaking queue' } });
  } catch (err) {
    next(err);
  }
});

// GET /api/matchmaking/status
router.get('/status', async (req, res, next) => {
  try {
    const status = await matchmakingService.getQueueStatus(req.user.id);
    res.status(200).json({ data: status });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
