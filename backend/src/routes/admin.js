const express = require('express');
const router = express.Router();
const publicRouter = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/mysql');
const verifyJWT = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');
const AppError = require('../utils/AppError');

// ── Public endpoints (no auth) ──
publicRouter.get('/pricing/public', async (req, res, next) => {
  try {
    const [tiers] = await pool.query('SELECT * FROM pricing_tiers WHERE is_active = 1 ORDER BY sort_order ASC');
    const result = [];
    for (const tier of tiers) {
      const [features] = await pool.query('SELECT * FROM feature_limits WHERE tier_id = ?', [tier.id]);
      result.push({ ...tier, features });
    }
    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
});

publicRouter.get('/curriculum/public', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM curriculum WHERE is_published = 1 ORDER BY sort_order ASC, created_at DESC'
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

// ── Public donation config ──
publicRouter.get('/site-config/donation', async (req, res, next) => {
  try {
    const [[enabled]] = await pool.query("SELECT `value` FROM site_config WHERE `key` = 'donation_enabled'");
    const [[settings]] = await pool.query("SELECT `value` FROM site_config WHERE `key` = 'donation_settings'");
    res.json({
      data: {
        enabled: enabled?.value === 'true',
        settings: settings ? JSON.parse(settings.value) : {},
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── Public feedback request status (for authenticated users) ──
publicRouter.get('/feedback/request-status', async (req, res, next) => {
  try {
    const [[active]] = await pool.query("SELECT `value` FROM site_config WHERE `key` = 'feedback_request_active'");
    const [[message]] = await pool.query("SELECT `value` FROM site_config WHERE `key` = 'feedback_request_message'");
    res.json({
      data: {
        active: active?.value === 'true',
        message: message?.value || '',
      },
    });
  } catch (err) {
    next(err);
  }
});

router.use(verifyJWT, requireAdmin);

// ── Dashboard stats ──────────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    const [[userCount]] = await pool.query('SELECT COUNT(*) AS total FROM users');
    const [[sessionCount]] = await pool.query('SELECT COUNT(*) AS total FROM sessions');
    const [[curriculumCount]] = await pool.query('SELECT COUNT(*) AS total FROM curriculum');
    const [[tierCount]] = await pool.query('SELECT COUNT(*) AS total FROM pricing_tiers');
    res.json({
      data: {
        totalUsers: Number(userCount.total),
        totalSessions: Number(sessionCount.total),
        totalCurriculum: Number(curriculumCount.total),
        totalTiers: Number(tierCount.total),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── Curriculum CRUD ──────────────────────────────────────
router.get('/curriculum', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM curriculum ORDER BY sort_order ASC, created_at DESC'
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

router.post('/curriculum', async (req, res, next) => {
  try {
    const { title, description, type, url, category, thumbnail_url, author, is_published, sort_order, access, content, level_number, mode } = req.body;
    if (!title || !url) return next(new AppError('Title and URL are required', 400));
    const id = uuidv4();
    await pool.query(
      `INSERT INTO curriculum (id, title, description, type, url, category, level_number, mode, thumbnail_url, author, is_published, sort_order, access, content)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title, description || '', type || 'blog', url, category || null, parseInt(level_number) || null, mode || 'solo', thumbnail_url || null, author || null, is_published ? 1 : 0, parseInt(sort_order) || 0, access || 'free', content || null]
    );
    res.status(201).json({ data: { id } });
  } catch (err) {
    next(err);
  }
});

router.put('/curriculum/:id', async (req, res, next) => {
  try {
    const [[existing]] = await pool.query('SELECT id FROM curriculum WHERE id = ?', [req.params.id]);
    if (!existing) return next(new AppError('Curriculum not found', 404));
    const allowed = ['title', 'description', 'type', 'url', 'category', 'level_number', 'mode', 'thumbnail_url', 'author', 'is_published', 'sort_order', 'access', 'content'];
    const sets = [];
    const values = [];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === 'is_published') {
          sets.push('is_published=?');
          values.push(req.body[key] ? 1 : 0);
        } else {
          sets.push(`${key}=?`);
          values.push(req.body[key]);
        }
      }
    }
    if (sets.length === 0) return next(new AppError('No fields to update', 400));
    values.push(req.params.id);
    await pool.query(`UPDATE curriculum SET ${sets.join(', ')} WHERE id=?`, values);
    res.json({ data: { id: req.params.id } });
  } catch (err) {
    next(err);
  }
});

router.delete('/curriculum/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM curriculum WHERE id = ?', [req.params.id]);
    res.json({ data: { id: req.params.id } });
  } catch (err) {
    next(err);
  }
});

// ── Pricing Tiers CRUD ───────────────────────────────────
router.get('/pricing', async (req, res, next) => {
  try {
    const [tiers] = await pool.query('SELECT * FROM pricing_tiers ORDER BY sort_order ASC');
    const result = [];
    for (const tier of tiers) {
      const [features] = await pool.query('SELECT * FROM feature_limits WHERE tier_id = ?', [tier.id]);
      result.push({ ...tier, features });
    }
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/pricing', async (req, res, next) => {
  try {
    const { name, slug, price_monthly, price_yearly, is_active, sort_order, features } = req.body;
    if (!name || !slug) return next(new AppError('Name and slug are required', 400));

    // Check slug uniqueness
    const [[existing]] = await pool.query('SELECT id FROM pricing_tiers WHERE slug = ?', [slug]);
    if (existing) return next(new AppError(`Slug "${slug}" already exists`, 409));

    const id = uuidv4();
    await pool.query(
      `INSERT INTO pricing_tiers (id, name, slug, price_monthly, price_yearly, is_active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, slug, price_monthly || 0, price_yearly || 0, is_active ?? 1, sort_order || 0]
    );
    if (features && Array.isArray(features)) {
      for (const feat of features) {
        await pool.query(
          `INSERT INTO feature_limits (id, tier_id, feature_key, feature_label, feature_value)
           VALUES (?, ?, ?, ?, ?)`,
          [uuidv4(), id, feat.feature_key, feat.feature_label, feat.feature_value || null]
        );
      }
    }
    res.status(201).json({ data: { id } });
  } catch (err) {
    next(err);
  }
});

router.put('/pricing/:id', async (req, res, next) => {
  try {
    const [[existing]] = await pool.query('SELECT id FROM pricing_tiers WHERE id = ?', [req.params.id]);
    if (!existing) return next(new AppError('Tier not found', 404));
    if (req.body.slug) {
      const [[slugTier]] = await pool.query('SELECT id FROM pricing_tiers WHERE slug = ? AND id != ?', [req.body.slug, req.params.id]);
      if (slugTier) return next(new AppError(`Slug "${req.body.slug}" already exists`, 409));
    }
    const allowed = ['name', 'slug', 'price_monthly', 'price_yearly', 'is_active', 'sort_order'];
    const sets = [];
    const values = [];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === 'is_active') {
          sets.push('is_active=?');
          values.push(req.body[key] ? 1 : 0);
        } else if (key === 'price_monthly' || key === 'price_yearly') {
          sets.push(`${key}=?`);
          values.push(req.body[key] || 0);
        } else {
          sets.push(`${key}=?`);
          values.push(req.body[key]);
        }
      }
    }
    if (sets.length > 0) {
      values.push(req.params.id);
      await pool.query(`UPDATE pricing_tiers SET ${sets.join(', ')} WHERE id=?`, values);
    }
    const { features } = req.body;
    if (features && Array.isArray(features)) {
      await pool.query('DELETE FROM feature_limits WHERE tier_id = ?', [req.params.id]);
      for (const feat of features) {
        await pool.query(
          `INSERT INTO feature_limits (id, tier_id, feature_key, feature_label, feature_value)
           VALUES (?, ?, ?, ?, ?)`,
          [uuidv4(), req.params.id, feat.feature_key, feat.feature_label, feat.feature_value || null]
        );
      }
    }
    res.json({ data: { id: req.params.id } });
  } catch (err) {
    next(err);
  }
});

router.delete('/pricing/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM pricing_tiers WHERE id = ?', [req.params.id]);
    res.json({ data: { id: req.params.id } });
  } catch (err) {
    next(err);
  }
});

// ── Site Config (donation, etc.) ──────────────────────────
router.get('/site-config', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT `key`, `value` FROM site_config');
    const config = {};
    for (const row of rows) {
      if (row.key === 'donation_settings') {
        try { config[row.key] = JSON.parse(row.value); } catch { config[row.key] = {}; }
      } else {
        config[row.key] = row.value;
      }
    }
    res.json({ data: config });
  } catch (err) {
    next(err);
  }
});

router.put('/site-config', async (req, res, next) => {
  try {
    const allowed = ['donation_enabled', 'donation_settings', 'feedback_request_active', 'feedback_request_message'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        const value = typeof req.body[key] === 'object' ? JSON.stringify(req.body[key]) : String(req.body[key]);
        await pool.query(
          'INSERT INTO site_config (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
          [key, value, value]
        );
      }
    }
    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
});

// ── Feedback Management ───────────────────────────────────
router.get('/feedback', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT f.*, u.name AS user_name, u.email AS user_email
       FROM user_feedback f
       LEFT JOIN users u ON u.id = f.user_id
       ORDER BY f.created_at DESC`
    );
    res.json({ data: rows.map(r => ({ ...r, user_name: r.user_name || 'Unknown', user_email: r.user_email || '' })) });
  } catch (err) {
    next(err);
  }
});

router.patch('/feedback/:id', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending', 'reviewed', 'resolved'].includes(status)) {
      return next(new AppError('Invalid status', 400));
    }
    await pool.query('UPDATE user_feedback SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ data: { id: req.params.id, status } });
  } catch (err) {
    next(err);
  }
});

router.post('/feedback/request', async (req, res, next) => {
  try {
    const { active, message } = req.body;
    await pool.query(
      'INSERT INTO site_config (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
      ['feedback_request_active', active ? 'true' : 'false', active ? 'true' : 'false']
    );
    if (message !== undefined) {
      await pool.query(
        'INSERT INTO site_config (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
        ['feedback_request_message', message, message]
      );
    }
    res.json({ data: { active: !!active, message: message || '' } });
  } catch (err) {
    next(err);
  }
});

// ── Payment Gateway Config ───────────────────────────────
router.get('/payment-config', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT `key`, `value` FROM payment_config');
    const cfg = {};
    for (const r of rows) cfg[r.key] = r.value;
    res.json({ data: cfg });
  } catch (err) {
    next(err);
  }
});

router.put('/payment-config', async (req, res, next) => {
  try {
    const allowed = [
      'ipaymu_enabled', 'ipaymu_virtual_account', 'ipaymu_api_key', 'ipaymu_mode',
      'midtrans_enabled', 'midtrans_server_key', 'midtrans_client_key', 'midtrans_merchant_id', 'midtrans_mode',
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        const value = String(req.body[key]);
        await pool.query(
          'INSERT INTO payment_config (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
          [key, value, value]
        );
      }
    }
    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
});

module.exports = { router, publicRouter };
