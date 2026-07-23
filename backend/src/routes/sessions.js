'use strict';

const { v4: uuidv4 } = require('uuid');
const express = require('express');
const pool = require('../db/mysql');
const redisClient = require('../db/redis');
const verifyJWT = require('../middleware/auth');
const validate = require('../middleware/validate');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { peerRatingSchema } = require('../validation/sessionSchemas');
const { BOT_USER_ID, BOT_USERNAME } = require('../services/aiBotService');

const router = express.Router();

router.use(verifyJWT);

const BOT_EMAIL = 'ai-bot@kodeye.app';

async function ensureBotUser() {
  const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [BOT_USER_ID]);
  if (existing.length > 0) return;

  await pool.query(
    `INSERT INTO users (id, email, display_name, experience_level, skill_categories, tech_stacks, preferred_language)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [BOT_USER_ID, BOT_EMAIL, BOT_USERNAME, 'senior', '[]', '["AI"]', 'en']
  );
  logger.info('AI bot user created');
}

// POST /api/sessions/ai-practice
router.post('/ai-practice', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { scenarioId } = req.body;

    await ensureBotUser();

    // Pick scenario
    let scenario;
    if (scenarioId) {
      const [rows] = await pool.query('SELECT * FROM scenarios WHERE id = ? AND is_active = 1', [scenarioId]);
      scenario = rows[0];
      if (!scenario) return next(new AppError('Scenario not found', 404, 'NOT_FOUND'));
    } else {
      const [rows] = await pool.query(
        'SELECT * FROM scenarios WHERE mode = ? AND is_active = 1 ORDER BY RAND() LIMIT 1',
        ['duel']
      );
      scenario = rows[0];
      if (!scenario) return next(new AppError('No available scenarios', 404, 'NOT_FOUND'));
    }

    const sessionId = uuidv4();
    const roles = Math.random() < 0.5 ? ['role_a', 'role_b'] : ['role_b', 'role_a'];

    await pool.query(
      `INSERT INTO sessions
         (id, scenario_id, mode, user_a_id, user_b_id, user_a_role, user_b_role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'waiting')`,
      [sessionId, scenario.id, 'duel', userId, BOT_USER_ID, roles[0], roles[1]]
    );

    logger.info(`AI practice session created | session=${sessionId} user=${userId} scenario=${scenario.id}`);

    const ic = scenario.initial_content
      ? (typeof scenario.initial_content === 'string' ? JSON.parse(scenario.initial_content) : scenario.initial_content)
      : null;

    const userRole = roles[0];
    const isRoleA = userRole === 'role_a';

    res.status(201).json({
      data: {
        sessionId,
        scenarioTitle: scenario.title_id || scenario.title,
        scenarioTitleEn: scenario.title || scenario.title_id,
        role: userRole,
        roleName: isRoleA ? (scenario.role_a_name_id || scenario.role_a_name) : (scenario.role_b_name_id || scenario.role_b_name),
        roleNameEn: isRoleA ? (scenario.role_a_name || scenario.role_a_name_id) : (scenario.role_b_name || scenario.role_b_name_id),
        briefing: isRoleA ? (scenario.role_a_briefing_id || scenario.role_a_briefing) : (scenario.role_b_briefing_id || scenario.role_b_briefing),
        briefingEn: isRoleA ? (scenario.role_a_briefing || scenario.role_a_briefing_id) : (scenario.role_b_briefing || scenario.role_b_briefing_id),
        problem: ic?.problem || null,
        problemEn: ic?.problem || null,
        template: ic?.template || null,
        templateLanguage: ic?.language || scenario.workspace_type || null,
        category: scenario.category,
        difficulty: scenario.difficulty,
        mode: 'duel',
        durationSeconds: scenario.duration_seconds,
        isBotOpponent: true,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Filter scenario briefings so a user only receives their own role's content.
 * This mirrors the same logic in arenaHandler — keep them in sync.
 */
const applyRoleFilter = (session, role) => {
  const base = { ...session };

  if (role === 'role_a') {
    delete base.role_b_briefing;
    delete base.role_b_secret_objective;
  } else {
    delete base.role_a_briefing;
    delete base.role_a_secret_objective;
  }

  return base;
};

const parseJsonCol = (val) => {
  if (!val || typeof val !== 'string') return val;
  try { return JSON.parse(val); } catch (_) { return val; }
};

// GET /api/sessions/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT
         s.id, s.scenario_id, s.mode,
         s.user_a_id, s.user_b_id,
         s.user_a_role, s.user_b_role,
         s.chat_transcript,
         s.user_a_score, s.user_b_score,
         s.user_a_ai_feedback, s.user_b_ai_feedback,
         s.team_score, s.team_ai_feedback,
         s.status, s.started_at, s.ended_at, s.created_at,
         sc.title AS scenario_title,
         sc.duration_seconds,
         sc.role_a_briefing, sc.role_a_secret_objective,
         sc.role_b_briefing, sc.role_b_secret_objective,
         sc.ai_criteria, sc.resource_links, sc.tags,
         sc.category, sc.difficulty, sc.mode AS scenario_mode
       FROM sessions s
       LEFT JOIN scenarios sc ON s.scenario_id = sc.id
       WHERE s.id = ?`,
      [id]
    );

    const session = rows[0];
    if (!session) return next(new AppError('Session not found', 404, 'NOT_FOUND'));

    // Only participants can view their session
    let role;
    if (session.user_a_id === userId) role = session.user_a_role || 'role_a';
    else if (session.user_b_id === userId) role = session.user_b_role || 'role_b';
    else return next(new AppError('You are not a participant in this session', 403, 'FORBIDDEN'));

    // Parse all JSON columns
    ['chat_transcript', 'user_a_ai_feedback', 'user_b_ai_feedback',
      'team_ai_feedback', 'ai_criteria', 'resource_links', 'tags'].forEach(col => {
      session[col] = parseJsonCol(session[col]);
    });

    // Strip opponent briefing from REST response — same rule as socket
    const filtered = applyRoleFilter(session, role);
    filtered.myRole = role;

    res.status(200).json({ data: filtered });
  } catch (err) {
    next(err);
  }
});

// POST /api/sessions/:id/peer-rating
router.post('/:id/peer-rating', validate(peerRatingSchema), async (req, res, next) => {
  try {
    const { id: sessionId } = req.params;
    const fromUserId = req.user.id;
    const { toUserId, rating, positiveFeedback, improvementFeedback } = req.body;

    // Verify session exists and requester is a participant
    const [rows] = await pool.query('SELECT user_a_id, user_b_id, status FROM sessions WHERE id = ?', [sessionId]);
    const session = rows[0];
    if (!session) return next(new AppError('Session not found', 404, 'NOT_FOUND'));

    const isParticipant = session.user_a_id === fromUserId || session.user_b_id === fromUserId;
    if (!isParticipant) return next(new AppError('You are not a participant in this session', 403, 'FORBIDDEN'));

    if (session.status !== 'completed') {
      return next(new AppError('Can only rate after the session is completed', 400, 'SESSION_NOT_COMPLETED'));
    }

    // toUserId must be the OTHER participant
    const validTargets = [session.user_a_id, session.user_b_id].filter((id) => id !== fromUserId);
    if (!validTargets.includes(toUserId)) {
      return next(new AppError('toUserId must be the other participant', 400, 'INVALID_TARGET'));
    }

    // Prevent duplicate ratings for same session
    const [existing] = await pool.query(
      'SELECT id FROM peer_ratings WHERE session_id = ? AND from_user_id = ?',
      [sessionId, fromUserId]
    );
    if (existing.length > 0) {
      return next(new AppError('You have already submitted a peer rating for this session', 409, 'ALREADY_RATED'));
    }

    const ratingId = uuidv4();
    await pool.query(
      `INSERT INTO peer_ratings (id, session_id, from_user_id, to_user_id, rating, positive_feedback, improvement_feedback)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ratingId, sessionId, fromUserId, toUserId, rating, positiveFeedback || null, improvementFeedback || null]
    );

    res.status(201).json({ data: { id: ratingId, message: 'Peer rating submitted' } });
  } catch (err) {
    next(err);
  }
});

// GET /api/sessions/:id/debrief
router.get('/:id/debrief', async (req, res, next) => {
  try {
    const { id: sessionId } = req.params;
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT
         s.id, s.mode, s.status,
         s.user_a_id, s.user_b_id,
         s.user_a_score, s.user_b_score,
         s.user_a_ai_feedback, s.user_b_ai_feedback,
         s.team_score, s.team_ai_feedback,
         s.started_at, s.ended_at,
         s.workspace_content,
         sc.title AS scenario_title,
         sc.ai_criteria, sc.resource_links, sc.tags,
         sc.category, sc.difficulty,
         sc.workspace_type, sc.initial_content
       FROM sessions s
       LEFT JOIN scenarios sc ON s.scenario_id = sc.id
       WHERE s.id = ?`,
      [sessionId]
    );

    const session = rows[0];
    if (!session) return next(new AppError('Session not found', 404, 'NOT_FOUND'));

    let myRole;
    if (session.user_a_id === userId) myRole = 'role_a';
    else if (session.user_b_id === userId) myRole = 'role_b';
    else return next(new AppError('You are not a participant in this session', 403, 'FORBIDDEN'));

    if (session.status !== 'completed') {
      return next(new AppError('Debrief is only available after the session completes', 400, 'SESSION_NOT_COMPLETED'));
    }

    // Parse JSON columns
    ['user_a_ai_feedback', 'user_b_ai_feedback', 'team_ai_feedback', 'ai_criteria', 'resource_links', 'tags', 'workspace_content', 'initial_content']
      .forEach((col) => { session[col] = parseJsonCol(session[col]); });

    // Deliver only the current user's score — never the opponent's raw feedback
    const myScore = myRole === 'role_a' ? session.user_a_score : session.user_b_score;
    const myFeedback = myRole === 'role_a' ? session.user_a_ai_feedback : session.user_b_ai_feedback;

    // Peer ratings received by this user for this session
    const [peerRatings] = await pool.query(
      `SELECT rating, positive_feedback, improvement_feedback, created_at
       FROM peer_ratings WHERE session_id = ? AND to_user_id = ?`,
      [sessionId, userId]
    );

    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.status(200).json({
      data: {
        sessionId,
        scenarioTitle: session.scenario_title,
        mode: session.mode,
        category: session.category,
        difficulty: session.difficulty,
        startedAt: session.started_at,
        endedAt: session.ended_at,
        myRole,
        myScore: session.mode === 'coop' ? session.team_score : myScore,
        myFeedback: session.mode === 'coop' ? parseJsonCol(session.team_ai_feedback) : myFeedback,
        aiCriteria: session.ai_criteria,
        resourceLinks: session.resource_links,
        peerRatings,
        skillCategory: session.skill_category || null,
        hasProblem: !!session.has_problem,
        workspaceType: session.workspace_type || 'chat',
        workspaceContent: session.workspace_content ? parseJsonCol(session.workspace_content) : null,
        initialContent: session.initial_content ? parseJsonCol(session.initial_content) : null,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
