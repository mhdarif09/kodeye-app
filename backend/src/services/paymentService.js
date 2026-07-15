const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const axios = require('axios');
const config = require('../config/env');
const pool = require('../db/mysql');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

const ipaymuBaseUrl = config.ipaymu.baseUrl;
const va = config.ipaymu.virtualAccount;
const apiKey = config.ipaymu.apiKey;

const generateSignature = (body, method, timestamp) => {
  const bodyStr = JSON.stringify(body);
  const stringToSign = `${bodyStr}|${method}|${va}|${timestamp}`;
  return crypto.createHmac('sha256', apiKey).update(stringToSign).digest('hex');
};

const createTransaction = async (userId, tierId, period = 'monthly') => {
  const [[tier]] = await pool.query('SELECT * FROM pricing_tiers WHERE id = ? AND is_active = 1', [tierId]);
  if (!tier) throw new AppError('Tier not found', 404, 'TIER_NOT_FOUND');

  const price = period === 'yearly' ? tier.price_yearly : tier.price_monthly;
  if (Number(price) <= 0) throw new AppError('Free tier cannot be purchased', 400, 'FREE_TIER');

  const [[user]] = await pool.query('SELECT email, display_name FROM users WHERE id = ?', [userId]);
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

  const orderId = `KODEYE-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  const subscriptionId = uuidv4();
  const periodDays = period === 'yearly' ? 365 : 30;

  const productName = `${tier.name} (${period === 'yearly' ? 'Tahunan' : 'Bulanan'})`;

  const body = {
    transactionId: orderId,
    product: [productName],
    qty: [1],
    price: [Number(price)],
    returnUrl: `${config.frontendUrl}/langganan?status=success&order_id=${orderId}`,
    cancelUrl: `${config.frontendUrl}/langganan?status=cancelled&order_id=${orderId}`,
    notifyUrl: `${config.backendUrl}/api/payment/notification`,
    name: user.display_name || user.email,
    email: user.email,
    phone: '',
    amount: Number(price),
    comments: productName,
  };

  const method = 'POST';
  const timestamp = new Date().toISOString();
  const signature = generateSignature(body, method, timestamp);
  const headers = {
    'Content-Type': 'application/json',
    'signature': signature,
    'va': va,
    'timestamp': timestamp,
  };

  logger.info(`iPaymu request: ${ipaymuBaseUrl}/api/v2/payment`, { orderId, amount: price });

  let response;
  try {
    response = await axios.post(`${ipaymuBaseUrl}/api/v2/payment`, body, { headers });
  } catch (err) {
    logger.error('iPaymu API error:', err.response?.data || err.message);
    throw new AppError('Payment gateway error', 502, 'PAYMENT_GATEWAY_ERROR');
  }

  const { Data } = response.data;
  if (!Data || !Data.url) {
    logger.error('iPaymu unexpected response:', response.data);
    throw new AppError('Payment gateway error: no URL', 502, 'PAYMENT_GATEWAY_ERROR');
  }

  await pool.query(
    `INSERT INTO subscriptions (id, user_id, tier_id, status, order_id, gross_amount, period_start, period_end)
     VALUES (?, ?, ?, 'pending', ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? DAY))`,
    [subscriptionId, userId, tierId, orderId, price, periodDays]
  );

  logger.info(`Payment transaction created: ${orderId} for user ${userId}`);

  return {
    subscriptionId,
    orderId,
    paymentUrl: Data.url,
    grossAmount: Number(price),
  };
};

const handleNotification = async (body, headers) => {
  // Verify iPaymu signature
  const signatureHeader = headers?.['signature'];
  if (signatureHeader) {
    const timestamp = headers?.['timestamp'];
    const expectedSig = generateSignature(body, 'POST', timestamp || new Date().toISOString());
    if (signatureHeader !== expectedSig) {
      logger.error('Invalid iPaymu signature', { received: signatureHeader, expected: expectedSig });
      throw new AppError('Invalid signature', 401);
    }
  } else {
    logger.warn('iPaymu notification without signature header — skipping verification');
  }

  const { trx_id, sid, merchant, status, via } = body;

  logger.info(`iPaymu notification received`, { trx_id, sid, status });

  if (!sid && !trx_id) {
    logger.warn('Notification missing sid and trx_id');
    throw new AppError('Invalid notification payload', 400);
  }

  // Look up by sid (iPaymu session ID) first, then trx_id
  const [subscriptions] = await pool.query(
    'SELECT * FROM subscriptions WHERE order_id = ? OR transaction_id = ?',
    [sid, trx_id]
  );
  if (subscriptions.length === 0) {
    logger.warn(`Subscription not found for sid=${sid} trx_id=${trx_id}`);
    throw new AppError('Subscription not found', 404);
  }

  const sub = subscriptions[0];
  let newStatus = sub.status;
  let paymentStatus = sub.payment_status;

  if (status === 'berhasil' || status === 'success') {
    paymentStatus = 'settlement';
    newStatus = 'active';
  } else if (status === 'pending') {
    paymentStatus = 'pending';
    newStatus = 'pending';
  } else if (status === 'expired' || status === 'expire') {
    paymentStatus = 'expire';
    newStatus = 'expired';
  } else {
    paymentStatus = status || 'unknown';
    newStatus = 'cancelled';
  }

  if (newStatus === 'active') {
    await pool.query(
      "UPDATE subscriptions SET status = 'expired' WHERE user_id = ? AND status = 'active' AND id != ?",
      [sub.user_id, sub.id]
    );
  }

  await pool.query(
    `UPDATE subscriptions SET status = ?, payment_status = ?, transaction_id = ?, payment_method = ? WHERE id = ?`,
    [newStatus, paymentStatus, trx_id || null, via || null, sub.id]
  );

  logger.info(`Subscription ${sub.id} updated: status=${newStatus}, payment=${paymentStatus}`);
};

const getUserSubscription = async (userId) => {
  const [subscriptions] = await pool.query(
    `SELECT s.*, t.name AS tier_name, t.slug AS tier_slug
     FROM subscriptions s
     JOIN pricing_tiers t ON t.id = s.tier_id
     WHERE s.user_id = ? AND s.status = 'active'
     ORDER BY s.created_at DESC
     LIMIT 1`,
    [userId]
  );
  return subscriptions[0] || null;
};

const getSubscriptionHistory = async (userId) => {
  const [subscriptions] = await pool.query(
    `SELECT s.*, t.name AS tier_name, t.slug AS tier_slug
     FROM subscriptions s
     JOIN pricing_tiers t ON t.id = s.tier_id
     WHERE s.user_id = ?
     ORDER BY s.created_at DESC`,
    [userId]
  );
  return subscriptions;
};

module.exports = {
  createTransaction,
  handleNotification,
  getUserSubscription,
  getSubscriptionHistory,
};
