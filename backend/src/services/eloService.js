'use strict';

const pool = require('../db/mysql');
const logger = require('../utils/logger');
const { DEFAULT_ELO, ELO_K_FACTOR } = require('../utils/constants');

// ─── ELO formula ──────────────────────────────────────────────────────────────

/**
 * Standard ELO calculation.
 *
 * @param {number} ratingA  - current ELO of player A
 * @param {number} ratingB  - current ELO of player B
 * @param {number} scoreA   - AI score for player A  (0-100)
 * @param {number} scoreB   - AI score for player B  (0-100)
 * @returns {{ newRatingA: number, newRatingB: number, deltaA: number, deltaB: number }}
 */
const calculateEloChange = (ratingA, ratingB, scoreA, scoreB) => {
  // Expected scores based on current ratings
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 / (1 + Math.pow(10, (ratingA - ratingB) / 400));

  // Actual outcome: higher AI score = win (1), tie = 0.5, loss = 0
  let actualA, actualB;
  if (scoreA > scoreB) {
    actualA = 1; actualB = 0;
  } else if (scoreA < scoreB) {
    actualA = 0; actualB = 1;
  } else {
    actualA = 0.5; actualB = 0.5;
  }

  const deltaA = Math.round(ELO_K_FACTOR * (actualA - expectedA));
  const deltaB = Math.round(ELO_K_FACTOR * (actualB - expectedB));

  return {
    newRatingA: ratingA + deltaA,
    newRatingB: ratingB + deltaB,
    deltaA,
    deltaB,
  };
};

// ─── persistence ──────────────────────────────────────────────────────────────

/**
 * Read the user's elo_ratings JSON, update the given skillCategory key, write back.
 * Uses a SELECT-then-UPDATE pattern (safe for single-server MVP).
 * TODO: wrap in DB transaction or use JSON_SET() directly for multi-server safety.
 *
 * @param {string} userId
 * @param {string} skillCategory  - e.g. 'INTERVIEW_PREP'
 * @param {number} newRating
 */
const updateUserElo = async (userId, skillCategory, newRating) => {
  const [rows] = await pool.query('SELECT elo_ratings FROM users WHERE id = ?', [userId]);
  if (!rows.length) return;

  let eloRatings = {};
  try {
    const raw = rows[0].elo_ratings;
    eloRatings = typeof raw === 'string' ? JSON.parse(raw) : (raw ?? {});
  } catch (_) { /* start fresh if corrupt */ }

  eloRatings[skillCategory] = newRating;

  await pool.query('UPDATE users SET elo_ratings = ? WHERE id = ?', [
    JSON.stringify(eloRatings),
    userId,
  ]);

  logger.info(`ELO updated | user=${userId} category=${skillCategory} newRating=${newRating}`);
};

// ─── public API ───────────────────────────────────────────────────────────────

/**
 * After a DUEL session is scored, pull both players' current ELO for the session's
 * skill category, compute the change, and persist.
 *
 * @param {object} sessionRow   - raw session DB row (user_a_id, user_b_id, user_a_score, user_b_score)
 * @param {string} skillCategory
 */
const processEloForSession = async (sessionRow, skillCategory) => {
  const { user_a_id, user_b_id, user_a_score, user_b_score } = sessionRow;

  // Fetch current ratings
  const [usersRows] = await pool.query(
    'SELECT id, elo_ratings FROM users WHERE id IN (?, ?)',
    [user_a_id, user_b_id]
  );

  const byId = {};
  usersRows.forEach((u) => {
    let elo = {};
    try { elo = typeof u.elo_ratings === 'string' ? JSON.parse(u.elo_ratings) : (u.elo_ratings ?? {}); } catch (_) {}
    byId[u.id] = elo[skillCategory] ?? DEFAULT_ELO;
  });

  const ratingA = byId[user_a_id] ?? DEFAULT_ELO;
  const ratingB = byId[user_b_id] ?? DEFAULT_ELO;

  const { newRatingA, newRatingB, deltaA, deltaB } = calculateEloChange(
    ratingA, ratingB, user_a_score ?? 0, user_b_score ?? 0
  );

  await Promise.all([
    updateUserElo(user_a_id, skillCategory, newRatingA),
    updateUserElo(user_b_id, skillCategory, newRatingB),
  ]);

  logger.info(
    `ELO processed | session category=${skillCategory} ` +
    `A: ${ratingA}→${newRatingA} (${deltaA > 0 ? '+' : ''}${deltaA}) ` +
    `B: ${ratingB}→${newRatingB} (${deltaB > 0 ? '+' : ''}${deltaB})`
  );

  return { newRatingA, newRatingB, deltaA, deltaB };
};

module.exports = { calculateEloChange, updateUserElo, processEloForSession };
