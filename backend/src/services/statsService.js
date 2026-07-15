'use strict';

const pool = require('../db/mysql');
const { BADGE_THRESHOLDS, DEFAULT_ELO } = require('../utils/constants');

// ─── badge resolver ───────────────────────────────────────────────────────────

const resolveBadges = (totalSessions) =>
  BADGE_THRESHOLDS.filter((b) => totalSessions >= b.minSessions);

// ─── public API ───────────────────────────────────────────────────────────────

/**
 * Aggregate stats for a user:
 *  - total sessions, win rate (duel), ELO per skill, earned badges
 */
const getUserStats = async (userId) => {
  // Total completed sessions
  const [[countRow]] = await pool.query(
    `SELECT
       COUNT(*) AS total_sessions,
       SUM(mode = 'duel') AS duel_sessions,
       SUM(mode = 'coop') AS coop_sessions
     FROM sessions
     WHERE (user_a_id = ? OR user_b_id = ?) AND status = 'completed'`,
    [userId, userId]
  );

  const totalSessions = Number(countRow.total_sessions) || 0;
  const duelSessions  = Number(countRow.duel_sessions)  || 0;
  const coopSessions  = Number(countRow.coop_sessions)  || 0;

  // Win rate — duel only: user's score strictly higher than opponent's
  let duelWins = 0;
  if (duelSessions > 0) {
    const [[winRow]] = await pool.query(
      `SELECT COUNT(*) AS wins FROM sessions
       WHERE status = 'completed' AND mode = 'duel'
         AND (
           (user_a_id = ? AND user_a_score > user_b_score)
           OR
           (user_b_id = ? AND user_b_score > user_a_score)
         )`,
      [userId, userId]
    );
    duelWins = Number(winRow.wins) || 0;
  }

  const winRate = duelSessions > 0 ? Math.round((duelWins / duelSessions) * 100) : null;

  // ELO ratings
  const [[userRow]] = await pool.query('SELECT elo_ratings FROM users WHERE id = ?', [userId]);
  let eloRatings = {};
  try {
    const raw = userRow?.elo_ratings;
    eloRatings = typeof raw === 'string' ? JSON.parse(raw) : (raw ?? {});
  } catch (_) {}

  // Ensure every known category has a value (default 1200)
  const { SKILL_CATEGORIES } = require('../utils/constants');
  const eloByCategory = {};
  SKILL_CATEGORIES.forEach((cat) => {
    eloByCategory[cat] = eloRatings[cat] ?? DEFAULT_ELO;
  });

  const badges = resolveBadges(totalSessions);

  return {
    totalSessions,
    duelSessions,
    coopSessions,
    duelWins,
    winRate,
    eloByCategory,
    badges,
  };
};

/**
 * Paginated session history for a user, joined to scenarios for title/category.
 *
 * @param {string} userId
 * @param {number} page   - 1-indexed
 * @param {number} limit  - rows per page (max capped at 100)
 */
const getUserHistory = async (userId, page = 1, limit = 20) => {
  const safePage  = Math.max(1, parseInt(page,  10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset    = (safePage - 1) * safeLimit;

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM sessions
     WHERE (user_a_id = ? OR user_b_id = ?) AND status = 'completed'`,
    [userId, userId]
  );

  const [rows] = await pool.query(
    `SELECT
       s.id, s.mode, s.status,
       s.user_a_id, s.user_b_id,
       s.user_a_score, s.user_b_score,
       s.team_score,
       s.started_at, s.ended_at,
       sc.title AS scenario_title,
       sc.category, sc.difficulty
     FROM sessions s
     LEFT JOIN scenarios sc ON s.scenario_id = sc.id
     WHERE (s.user_a_id = ? OR s.user_b_id = ?) AND s.status = 'completed'
     ORDER BY s.ended_at DESC
     LIMIT ? OFFSET ?`,
    [userId, userId, safeLimit, offset]
  );

  // Annotate each row with the caller's score and win/loss/draw
  const history = rows.map((row) => {
    const isUserA = row.user_a_id === userId;
    const myScore  = isUserA ? row.user_a_score  : row.user_b_score;
    const oppScore = isUserA ? row.user_b_score   : row.user_a_score;
    const opponentId = isUserA ? row.user_b_id : row.user_a_id;

    let result = null;
    if (row.mode === 'duel' && myScore !== null && oppScore !== null) {
      result = myScore > oppScore ? 'win' : myScore < oppScore ? 'loss' : 'draw';
    }

    return {
      sessionId:     row.id,
      mode:          row.mode,
      scenarioTitle: row.scenario_title,
      category:      row.category,
      difficulty:    row.difficulty,
      myScore:       row.mode === 'coop' ? row.team_score : myScore,
      opponentId:    row.mode === 'duel' ? opponentId : null,
      result,
      startedAt:     row.started_at,
      endedAt:       row.ended_at,
    };
  });

  return {
    history,
    pagination: {
      page:       safePage,
      limit:      safeLimit,
      total:      Number(total),
      totalPages: Math.ceil(Number(total) / safeLimit),
    },
  };
};

module.exports = { getUserStats, getUserHistory };
