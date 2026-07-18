const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const axios = require('axios');
const config = require('../config/env');
const pool = require('../db/mysql');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

// ─── Load active gateway config from DB ──────────────────
const loadGatewayConfig = async () => {
  const [rows] = await pool.query('SELECT `key`, `value` FROM payment_config');
  const cfg = {};
  for (const r of rows) cfg[r.key] = r.value;
  return cfg;
};

// ─── iPaymu helpers ──────────────────────────────────────
const ipaymuSignature = (body, method, timestamp, apiKey) => {
  const bodyStr = JSON.stringify(body);
  const va = ''; // will be set per-request
  const stringToSign = `${bodyStr}|${method}|${va}|${timestamp}`;
  return crypto.createHmac('sha256', apiKey).update(stringToSign).digest('hex');
};

const createIpaymuTransaction = async (userId, tier, period, user, gatewayCfg) => {
  const price = period === 'yearly' ? tier.price_yearly : tier.price_monthly;
  const orderId = `KODEYE-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  const productName = `${tier.name} (${period === 'yearly' ? 'Tahunan' : 'Bulanan'})`;

  const va = gatewayCfg.ipaymu_virtual_account || config.ipaymu.virtualAccount;
  const apiKey = gatewayCfg.ipaymu_api_key || config.ipaymu.apiKey;
  const mode = gatewayCfg.ipaymu_mode || config.ipaymu.mode;
  const baseUrl = mode === 'production' ? 'https://my.ipaymu.com' : 'https://sandbox.ipaymu.com';

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
  const signature = ipaymuSignature(body, method, timestamp, apiKey);
  const headers = {
    'Content-Type': 'application/json',
    signature,
    va,
    timestamp,
  };

  logger.info(`iPaymu request: ${baseUrl}/api/v2/payment`, { orderId, amount: price });

  let response;
  try {
    response = await axios.post(`${baseUrl}/api/v2/payment`, body, { headers });
  } catch (err) {
    logger.error('iPaymu API error:', err.response?.data || err.message);
    throw new AppError('Payment gateway error', 502, 'PAYMENT_GATEWAY_ERROR');
  }

  const { Data } = response.data;
  if (!Data || !Data.url) {
    logger.error('iPaymu unexpected response:', response.data);
    throw new AppError('Payment gateway error: no URL', 502, 'PAYMENT_GATEWAY_ERROR');
  }

  return { orderId, paymentUrl: Data.url, grossAmount: Number(price), productName };
};

// ─── Midtrans helpers ────────────────────────────────────
const createMidtransTransaction = async (userId, tier, period, user, gatewayCfg) => {
  const price = period === 'yearly' ? tier.price_yearly : tier.price_monthly;
  const orderId = `KODEYE-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  const productName = `${tier.name} (${period === 'yearly' ? 'Tahunan' : 'Bulanan'})`;

  const serverKey = gatewayCfg.midtrans_server_key || config.midtrans.serverKey;
  const mode = gatewayCfg.midtrans_mode || config.midtrans.mode;
  const snapUrl = mode === 'production'
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

  const body = {
    transaction_details: {
      order_id: orderId,
      gross_amount: Number(price),
    },
    item_details: [{
      id: tier.id,
      price: Number(price),
      quantity: 1,
      name: productName,
    }],
    customer_details: {
      first_name: user.display_name || user.email,
      email: user.email,
    },
    callbacks: {
      finish: `${config.frontendUrl}/langganan?status=success&order_id=${orderId}`,
      error: `${config.frontendUrl}/langganan?status=error&order_id=${orderId}`,
      pending: `${config.frontendUrl}/langganan?status=pending&order_id=${orderId}`,
    },
  };

  const auth = Buffer.from(`${serverKey}:`).toString('base64');

  logger.info(`Midtrans request: ${snapUrl}`, { orderId, amount: price });

  let response;
  try {
    response = await axios.post(snapUrl, body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    });
  } catch (err) {
    logger.error('Midtrans API error:', err.response?.data || err.message);
    throw new AppError('Payment gateway error', 502, 'PAYMENT_GATEWAY_ERROR');
  }

  const { token, redirect_url } = response.data;
  if (!token || !redirect_url) {
    logger.error('Midtrans unexpected response:', response.data);
    throw new AppError('Payment gateway error: no token', 502, 'PAYMENT_GATEWAY_ERROR');
  }

  return { orderId, token, redirectUrl: redirect_url, grossAmount: Number(price), productName };
};

// ─── Public entry point ──────────────────────────────────
const createTransaction = async (userId, tierId, period = 'monthly', gateway = 'ipaymu') => {
  const [[tier]] = await pool.query('SELECT * FROM pricing_tiers WHERE id = ? AND is_active = 1', [tierId]);
  if (!tier) throw new AppError('Tier not found', 404, 'TIER_NOT_FOUND');

  const price = period === 'yearly' ? tier.price_yearly : tier.price_monthly;
  if (Number(price) <= 0) throw new AppError('Free tier cannot be purchased', 400, 'FREE_TIER');

  const [[user]] = await pool.query('SELECT email, display_name FROM users WHERE id = ?', [userId]);
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

  const gatewayCfg = await loadGatewayConfig();

  // Check gateway is enabled
  if (gateway === 'ipaymu' && gatewayCfg.ipaymu_enabled !== 'true') {
    throw new AppError('iPaymu payment is disabled', 400, 'GATEWAY_DISABLED');
  }
  if (gateway === 'midtrans' && gatewayCfg.midtrans_enabled !== 'true') {
    throw new AppError('Midtrans payment is disabled', 400, 'GATEWAY_DISABLED');
  }

  const subscriptionId = uuidv4();
  const periodDays = period === 'yearly' ? 365 : 30;

  let result;
  if (gateway === 'midtrans') {
    result = await createMidtransTransaction(userId, tier, period, user, gatewayCfg);
  } else {
    result = await createIpaymuTransaction(userId, tier, period, user, gatewayCfg);
  }

  await pool.query(
    `INSERT INTO subscriptions (id, user_id, tier_id, status, order_id, gross_amount, payment_gateway, period_start, period_end)
     VALUES (?, ?, ?, 'pending', ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? DAY))`,
    [subscriptionId, userId, tierId, result.orderId, result.grossAmount, gateway, periodDays]
  );

  logger.info(`Payment transaction created: ${result.orderId} via ${gateway} for user ${userId}`);

  return {
    subscriptionId,
    gateway,
    ...result,
  };
};

// ─── Webhook handler ─────────────────────────────────────
const handleNotification = async (body, headers) => {
  const bodyStr = JSON.stringify(body);
  const contentType = headers?.['content-type'] || '';

  // Detect gateway by content-type or body structure
  if (contentType.includes('application/json') && body.transaction_status) {
    // Midtrans notification (JSON with transaction_status)
    return handleMidtransNotification(body);
  } else {
    // iPaymu notification
    return handleIpaymuNotification(body, headers);
  }
};

// ─── iPaymu webhook ──────────────────────────────────────
const handleIpaymuNotification = async (body, headers) => {
  const gatewayCfg = await loadGatewayConfig();
  const apiKey = gatewayCfg.ipaymu_api_key || config.ipaymu.apiKey;
  const signatureHeader = headers?.['signature'];

  if (signatureHeader) {
    const timestamp = headers?.['timestamp'];
    const expectedSig = ipaymuSignature(body, 'POST', timestamp || new Date().toISOString(), apiKey);
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
    paymentStatus = 'settlement'; newStatus = 'active';
  } else if (status === 'pending') {
    paymentStatus = 'pending'; newStatus = 'pending';
  } else if (status === 'expired' || status === 'expire') {
    paymentStatus = 'expire'; newStatus = 'expired';
  } else {
    paymentStatus = status || 'unknown'; newStatus = 'cancelled';
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

// ─── Midtrans webhook ────────────────────────────────────
const handleMidtransNotification = async (body) => {
  const {
    order_id, transaction_status, fraud_status,
    payment_type, gross_amount, transaction_id, signature_key, status_code,
  } = body;

  logger.info(`Midtrans notification received`, { order_id, transaction_status, fraud_status });

  if (!order_id) throw new AppError('Invalid notification: missing order_id', 400);

  // Verify signature
  const gatewayCfg = await loadGatewayConfig();
  const serverKey = gatewayCfg.midtrans_server_key || config.midtrans.serverKey;

  const hash = crypto.createHash('sha512')
    .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
    .digest('hex');

  if (signature_key !== hash) {
    logger.error('Invalid Midtrans signature', { received: signature_key, expected: hash });
    throw new AppError('Invalid signature', 401);
  }

  const [subscriptions] = await pool.query(
    'SELECT * FROM subscriptions WHERE order_id = ?',
    [order_id]
  );
  if (subscriptions.length === 0) {
    logger.warn(`Subscription not found for order_id=${order_id}`);
    throw new AppError('Subscription not found', 404);
  }

  const sub = subscriptions[0];
  let newStatus = sub.status;
  let paymentStatus = sub.payment_status;

  if (transaction_status === 'settlement' || transaction_status === 'capture') {
    if (fraud_status === 'accept' || fraud_status === 'challenge') {
      paymentStatus = 'settlement';
      newStatus = 'active';
    }
  } else if (transaction_status === 'pending') {
    paymentStatus = 'pending';
    newStatus = 'pending';
  } else if (transaction_status === 'deny' || transaction_status === 'cancel') {
    paymentStatus = transaction_status;
    newStatus = 'cancelled';
  } else if (transaction_status === 'expire') {
    paymentStatus = 'expire';
    newStatus = 'expired';
  }

  if (newStatus === 'active') {
    await pool.query(
      "UPDATE subscriptions SET status = 'expired' WHERE user_id = ? AND status = 'active' AND id != ?",
      [sub.user_id, sub.id]
    );
  }

  await pool.query(
    `UPDATE subscriptions SET status = ?, payment_status = ?, transaction_id = ?, payment_method = ?, payment_gateway = 'midtrans' WHERE id = ?`,
    [newStatus, paymentStatus, transaction_id || null, payment_type || null, sub.id]
  );

  logger.info(`Subscription ${sub.id} updated: status=${newStatus}, payment=${paymentStatus}`);
};

// ─── Query helpers ───────────────────────────────────────
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
