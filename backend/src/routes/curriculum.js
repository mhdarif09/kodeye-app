const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/mysql');
const verifyJWT = require('../middleware/auth');
const AppError = require('../utils/AppError');

const router = express.Router();

router.use(verifyJWT);

// GET /api/curriculum/:id — full detail with content, gated by access level
router.get('/:id', async (req, res, next) => {
  try {
    const [[item]] = await pool.query(
      'SELECT id, title, description, type, url, content, category, thumbnail_url, author, access, sort_order, created_at FROM curriculum WHERE id = ? AND is_published = 1',
      [req.params.id]
    );
    if (!item) return next(new AppError('Curriculum not found', 404));

    if (item.access === 'premium') {
      const [subs] = await pool.query(
        "SELECT s.* FROM subscriptions s WHERE s.user_id = ? AND s.status = 'active' AND s.period_end > NOW() LIMIT 1",
        [req.user.id]
      );
      if (subs.length === 0) {
        return next(new AppError('This content requires an active subscription', 403, 'PREMIUM_REQUIRED'));
      }
    }

    // Auto-mark as completed when user opens reader
    const progressId = uuidv4();
    await pool.query(
      `INSERT INTO user_curriculum_progress (id, user_id, curriculum_id, completed, completed_at)
       VALUES (?, ?, ?, 1, NOW())
       ON DUPLICATE KEY UPDATE completed = 1, completed_at = COALESCE(completed_at, NOW())`,
      [progressId, req.user.id, req.params.id]
    );

    // Check if should issue certificate
    await checkAndIssueCertificate(req.user.id, req.params.id);

    res.json({ data: item });
  } catch (err) {
    next(err);
  }
});

// POST /api/curriculum/:id/complete — manually mark complete
router.post('/:id/complete', async (req, res, next) => {
  try {
    const progressId = uuidv4();
    await pool.query(
      `INSERT INTO user_curriculum_progress (id, user_id, curriculum_id, completed, completed_at)
       VALUES (?, ?, ?, 1, NOW())
       ON DUPLICATE KEY UPDATE completed = 1, completed_at = COALESCE(completed_at, NOW())`,
      [progressId, req.user.id, req.params.id]
    );
    await checkAndIssueCertificate(req.user.id, req.params.id);
    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
});

// GET /api/curriculum/progress — user's progress
router.get('/progress/list', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.title AS curriculum_title, c.type AS curriculum_type, c.access AS curriculum_access
       FROM user_curriculum_progress p
       JOIN curriculum c ON c.id = p.curriculum_id
       WHERE p.user_id = ?
       ORDER BY p.completed_at DESC`,
      [req.user.id]
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/curriculum/certificates — user's certificates
router.get('/certificates/list', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM certificates WHERE user_id = ? ORDER BY issued_at DESC',
      [req.user.id]
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

// Helper: check conditions and issue certificate
async function checkAndIssueCertificate(userId, curriculumId) {
  try {
    const [[curriculum]] = await pool.query('SELECT id, title, access FROM curriculum WHERE id = ?', [curriculumId]);
    if (!curriculum) return;

    // Only issue certificate for premium curriculum
    if (curriculum.access !== 'premium') return;

    // Check if already issued
    const [[existing]] = await pool.query(
      'SELECT id FROM certificates WHERE user_id = ? AND metadata->>"$.curriculum_id" = ?',
      [userId, curriculumId]
    );
    if (existing) return;

    // Check if user has active subscription (for premium cert)
    const [subs] = await pool.query(
      "SELECT s.* FROM subscriptions s WHERE s.user_id = ? AND s.status = 'active' AND s.period_end > NOW() LIMIT 1",
      [userId]
    );

    // Check if user has score >= 80 in any session
    const [[highScore]] = await pool.query(
      'SELECT COUNT(*) AS total FROM sessions WHERE (user_a_id = ? OR user_b_id = ?) AND (user_a_score >= 80 OR user_b_score >= 80) LIMIT 1',
      [userId, userId]
    );

    const hasSubscription = subs.length > 0;
    const hasHighScore = Number(highScore?.total || 0) > 0;

    // Issue certificate if: premium user OR (free user with high score)
    if (hasSubscription || hasHighScore) {
      const certId = uuidv4();
      await pool.query(
        `INSERT INTO certificates (id, user_id, type, title, description, metadata)
         VALUES (?, ?, 'curriculum', ?, ?, ?)`,
        [
          certId,
          userId,
          `Sertifikat: ${curriculum.title}`,
          `Telah menyelesaikan materi ${curriculum.title}`,
          JSON.stringify({ curriculum_id: curriculumId }),
        ]
      );
    }
  } catch (err) {
    // Don't throw — certificate issuance is best-effort
    console.error('Certificate issuance error:', err.message);
  }
}

module.exports = router;
