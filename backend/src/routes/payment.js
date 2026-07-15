const express = require('express');
const paymentService = require('../services/paymentService');
const verifyJWT = require('../middleware/auth');

const router = express.Router();

router.post('/create-transaction', verifyJWT, async (req, res, next) => {
  try {
    const { tierId, period } = req.body;
    if (!tierId) return res.status(400).json({ error: { message: 'Tier ID is required', code: 'MISSING_TIER' } });

    const result = await paymentService.createTransaction(req.user.id, tierId, period || 'monthly');
    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/subscription', verifyJWT, async (req, res, next) => {
  try {
    const subscription = await paymentService.getUserSubscription(req.user.id);
    res.status(200).json({ data: subscription });
  } catch (error) {
    next(error);
  }
});

router.get('/history', verifyJWT, async (req, res, next) => {
  try {
    const history = await paymentService.getSubscriptionHistory(req.user.id);
    res.status(200).json({ data: history });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
