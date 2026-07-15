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
    const { title, description, type, url, category, thumbnail_url, author, is_published, sort_order } = req.body;
    if (!title || !url) return next(new AppError('Title and URL are required', 400));
    const id = uuidv4();
    await pool.query(
      `INSERT INTO curriculum (id, title, description, type, url, category, thumbnail_url, author, is_published, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title, description || '', type || 'blog', url, category || null, thumbnail_url || null, author || null, is_published ? 1 : 0, sort_order || 0]
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
    const allowed = ['title', 'description', 'type', 'url', 'category', 'thumbnail_url', 'author', 'is_published', 'sort_order'];
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
    const id = uuidv4();
    await pool.query(
      `INSERT INTO pricing_tiers (id, name, slug, price_monthly, price_yearly, is_active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, slug, price_monthly || 0, price_yearly || 0, is_active ? 1 : 0, sort_order || 0]
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

module.exports = { router, publicRouter };
