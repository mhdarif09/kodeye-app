'use strict';

const { v4: uuidv4 } = require('uuid');
const redisClient = require('../db/redis');
const pool = require('../db/mysql');
const logger = require('../utils/logger');

const QUEUE_TTL_SECONDS = 300; // 5 min hard max before Redis auto-cleans
const MATCH_TIMEOUT_MS = 60 * 1000; // 60 seconds

const difficultyLabels = { beginner: 'Pemula', intermediate: 'Menengah', advanced: 'Lanjutan' };

// ─── helpers ──────────────────────────────────────────────────────────────────

const buildQueueKey = (mode, category, difficulty) =>
  `queue:${mode}:${category}:${difficulty}`;

// ─── queue operations ─────────────────────────────────────────────────────────

/**
 * Push a user into the appropriate Redis list queue.
 * Each element is JSON so we can track joinedAt for timeout checks.
 */
const joinQueue = async (userId, mode, category, difficulty) => {
  const key = buildQueueKey(mode, category, difficulty);
  const entry = JSON.stringify({ userId, joinedAt: Date.now() });

  // RPUSH so LPOP later gives FIFO order
  await redisClient.rpush(key, entry);
  // Extend TTL on every push so the list doesn't linger if nobody joins
  await redisClient.expire(key, QUEUE_TTL_SECONDS);

  logger.info(`User ${userId} joined queue: ${key}`);
  return { key, position: await redisClient.llen(key) };
};

/**
 * Remove a specific user from a queue list.
 * Redis LREM removes all occurrences that match.
 */
const leaveQueue = async (userId, mode, category, difficulty) => {
  const key = buildQueueKey(mode, category, difficulty);

  // Scan all entries and filter out the one belonging to this userId
  const raw = await redisClient.lrange(key, 0, -1);
  for (const item of raw) {
    try {
      const parsed = JSON.parse(item);
      if (parsed.userId === userId) {
        await redisClient.lrem(key, 1, item);
        logger.info(`User ${userId} left queue: ${key}`);
        return true;
      }
    } catch (_) { /* skip malformed entries */ }
  }
  return false;
};

/**
 * Return elapsed wait time and position for the given user across ALL queue keys.
 */
const getQueueStatus = async (userId) => {
  const keys = await redisClient.keys('queue:*');

  for (const key of keys) {
    const raw = await redisClient.lrange(key, 0, -1);
    for (let i = 0; i < raw.length; i++) {
      try {
        const parsed = JSON.parse(raw[i]);
        if (parsed.userId === userId) {
          const elapsedMs = Date.now() - parsed.joinedAt;
          const [, mode, category, difficulty] = key.split(':');
          return {
            inQueue: true,
            key,
            mode,
            category,
            difficulty,
            position: i + 1,
            elapsedSeconds: Math.floor(elapsedMs / 1000),
          };
        }
      } catch (_) { /* skip */ }
    }
  }

  return { inQueue: false };
};

// ─── session creation + briefing injection ───────────────────────────────────

/**
 * Append a single message to the session's chat_transcript JSON array.
 */
const appendMessage = async (sessionId, msg) => {
  try {
    await pool.query(
      `UPDATE sessions
       SET chat_transcript = JSON_ARRAY_APPEND(
         COALESCE(chat_transcript, JSON_ARRAY()),
         '$',
         CAST(? AS JSON)
       )
       WHERE id = ?`,
      [JSON.stringify(msg), sessionId]
    );
  } catch (err) {
    logger.error(`appendMessage failed | session=${sessionId}`, { error: err.message });
  }
};

/**
 * Build an Indonesian-only private briefing for one participant.
 * Secret objectives are NEVER included.
 */
const formatBriefing = (scenario, role) => {
  const isRoleA = role === 'role_a';
  const titleId = scenario.title_id || scenario.title;
  const roleName = isRoleA
    ? (scenario.role_a_name_id || scenario.role_a_name || 'Peran A')
    : (scenario.role_b_name_id || scenario.role_b_name || 'Peran B');
  const briefing = isRoleA
    ? (scenario.role_a_briefing_id || scenario.role_a_briefing || '')
    : (scenario.role_b_briefing_id || scenario.role_b_briefing || '');
  const diff = difficultyLabels[scenario.difficulty] || scenario.difficulty || '-';
  const modeLabel = scenario.mode === 'duel' ? '⚔️ Duel' : '🤝 Co-op';

  return `📋 **${titleId}**
Kategori: \`${scenario.category || '-'}\` · Mode: \`${modeLabel}\` · Level: \`${diff}\`

---

**Peran kamu: ${roleName}**

${briefing}`;
};

/**
 * Build an Indonesian-only start hint.
 */
const formatStartHint = (scenario) => {
  const aName = scenario.role_a_name_id || scenario.role_a_name || 'Peran A';
  const bName = scenario.role_b_name_id || scenario.role_b_name || 'Peran B';

  if (scenario.mode === 'coop') {
    return `${aName} dan ${bName}, silakan mulai diskusi untuk menyelesaikan situasi ini bersama.`;
  }
  return `${aName}, silakan mulai percakapan sesuai skenario kamu.`;
};

const createSession = async (entryA, entryB, mode, category) => {
  const sessionId = uuidv4();

  // Pick a random scenario that matches mode + category
  const [scenarioRows] = await pool.query(
    `SELECT * FROM scenarios WHERE mode = ? AND category = ? AND is_active = 1 ORDER BY RAND() LIMIT 1`,
    [mode, category]
  );

  const scenario = scenarioRows[0];
  if (!scenario) {
    logger.error(`No active scenario for mode=${mode} category=${category}`);
    return null;
  }

  // Randomly assign roles
  const [userA, userB] = Math.random() < 0.5
    ? [entryA, entryB]
    : [entryB, entryA];

  await pool.query(
    `INSERT INTO sessions
       (id, scenario_id, mode, user_a_id, user_b_id, user_a_role, user_b_role, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'waiting')`,
    [sessionId, scenario.id, mode, userA.userId, userB.userId, 'role_a', 'role_b']
  );

  logger.info(
    `Match created | session=${sessionId} mode=${mode} category=${category} ` +
    `user_a=${userA.userId} user_b=${userB.userId} scenario=${scenario.id}`
  );

  // ── Build & inject briefing messages into chat_transcript ───────────────
  // These are replayed when users join via arena:join, so no socket emits here.

  const now = new Date().toISOString();

  // Private briefing for role_a (targetRole prevents leaking to opponent)
  const textA = formatBriefing(scenario, 'role_a');
  await appendMessage(sessionId, { userId: 'system', role: 'system', targetRole: 'role_a', text: textA, ts: now });

  // Private briefing for role_b
  const textB = formatBriefing(scenario, 'role_b');
  await appendMessage(sessionId, { userId: 'system', role: 'system', targetRole: 'role_b', text: textB, ts: now });

  // Artifact block — problem + template jika initial_content tersedia (broadcast ke room)
  const ic = scenario.initial_content
    ? (typeof scenario.initial_content === 'string' ? JSON.parse(scenario.initial_content) : scenario.initial_content)
    : null;
  if (ic && ic.problem) {
    const lang = ic.language || scenario.workspace_type || '';
    const artifactText = `**🗂️ Soal:**
${ic.problem || ''}

\`\`\`${lang}
${ic.template || ''}
\`\`\``;
    await appendMessage(sessionId, { userId: 'system', role: 'system', text: artifactText, ts: now });
  }

  // Start hint (no targetRole — visible to both)
  const hintText = formatStartHint(scenario);
  await appendMessage(sessionId, { userId: 'system', role: 'system', text: hintText, ts: now });

  return {
    sessionId,
    scenarioId: scenario.id,
    mode,
    category,
    difficulty: scenario.difficulty,
    scenarioTitle: scenario.title_id || scenario.title,
    scenarioTitleEn: scenario.title || scenario.title_id,
    roleAName: scenario.role_a_name_id || scenario.role_a_name,
    roleANameEn: scenario.role_a_name || scenario.role_a_name_id,
    roleBName: scenario.role_b_name_id || scenario.role_b_name,
    roleBNameEn: scenario.role_b_name || scenario.role_b_name_id,
    briefingA: scenario.role_a_briefing_id || scenario.role_a_briefing,
    briefingAEn: scenario.role_a_briefing || scenario.role_a_briefing_id,
    briefingB: scenario.role_b_briefing_id || scenario.role_b_briefing,
    briefingBEn: scenario.role_b_briefing || scenario.role_b_briefing_id,
    problem: ic?.problem || null,
    problemEn: ic?.problem || null,
    template: ic?.template || null,
    templateLanguage: ic?.language || scenario.workspace_type || null,
    durationSeconds: scenario.duration_seconds,
    userA: { userId: userA.userId, role: 'role_a' },
    userB: { userId: userB.userId, role: 'role_b' },
  };
};

// ─── match finder (called by setInterval) ────────────────────────────────────

/**
 * io is passed in from index.js once Socket.io is initialised.
 * io is optional at this stage — emit calls are guarded.
 */
let _io = null;
const setIo = (io) => { _io = io; };

const BOT_USER_ID = '00000000-0000-0000-0000-000000000001';

const createAiOpponentSession = async (userId, mode, category, difficulty) => {
  if (mode !== 'duel') return null;
  
  try {
    const [rows] = await pool.query(
      `SELECT * FROM scenarios 
       WHERE mode = ? AND category = ? AND difficulty = ? AND is_active = 1 
       ORDER BY RAND() LIMIT 1`,
      [mode, category, difficulty]
    );
    
    if (!rows.length) {
      logger.warn(`No scenarios for AI fallback | mode=${mode} cat=${category} diff=${difficulty}`);
      return null;
    }
    
    const scenario = rows[0];
    const sessionId = uuidv4();
    const roles = Math.random() < 0.5 ? ['role_a', 'role_b'] : ['role_b', 'role_a'];
    
    await pool.query(
      `INSERT INTO sessions
         (id, scenario_id, mode, user_a_id, user_b_id, user_a_role, user_b_role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'waiting')`,
      [sessionId, scenario.id, mode, userId, BOT_USER_ID, roles[0], roles[1]]
    );
    
    logger.info(`AI opponent session created | session=${sessionId} user=${userId} scenario=${scenario.id}`);
    
    return { sessionId, scenario, userRole: roles[0], botRole: roles[1] };
  } catch (err) {
    logger.error(`AI opponent creation failed | user=${userId}`, { error: err.message });
    return null;
  }
};

const findMatch = async () => {
  try {
    const keys = await redisClient.keys('queue:*');
    if (!keys.length) return;

    for (const key of keys) {
      const [, mode, category, difficulty] = key.split(':');

      // Check for timeouts first — scan without popping
      const allRaw = await redisClient.lrange(key, 0, -1);
      for (const item of allRaw) {
        try {
          const entry = JSON.parse(item);
          const elapsed = Date.now() - entry.joinedAt;
          if (elapsed >= MATCH_TIMEOUT_MS) {
            // Remove the timed-out entry from queue
            await redisClient.lrem(key, 1, item);
            logger.warn(`Queue timeout for user ${entry.userId} on ${key}`);

            // Auto-create AI opponent for Duel mode
            if (mode === 'duel') {
              const aiSession = await createAiOpponentSession(entry.userId, mode, category, difficulty);
              if (aiSession && _io) {
                _io.to(`user:${entry.userId}`).emit('match_briefing', {
                  sessionId: aiSession.sessionId,
                  role: aiSession.userRole,
                  roleName: aiSession.scenario[`role_a_name_id`] || aiSession.scenario[`role_a_name`] || 'Peran A',
                  roleNameEn: aiSession.scenario[`role_a_name`] || aiSession.scenario[`role_a_name_id`] || 'Role A',
                  briefing: aiSession.scenario[`role_a_briefing_id`] || aiSession.scenario[`role_a_briefing`] || '',
                  briefingEn: aiSession.scenario[`role_a_briefing`] || aiSession.scenario[`role_a_briefing_id`] || '',
                  scenarioTitle: aiSession.scenario.title_id || aiSession.scenario.title,
                  scenarioTitleEn: aiSession.scenario.title || aiSession.scenario.title_id,
                  category: aiSession.scenario.category,
                  difficulty: aiSession.scenario.difficulty,
                  mode: aiSession.scenario.mode,
                  durationSeconds: aiSession.scenario.duration_seconds,
                  problem: null,
                  problemEn: null,
                  template: null,
                  templateLanguage: null,
                  isBotOpponent: true,
                });
                logger.info(`AI opponent assigned after timeout | user=${entry.userId} session=${aiSession.sessionId}`);
                continue;
              }
            }

            if (_io) {
              _io.to(`user:${entry.userId}`).emit('match:timeout', {
                userId: entry.userId,
                message: 'No match found. You can continue against an AI opponent.',
                aiOpponentAvailable: true,
              });
            }
          }
        } catch (_) { /* skip */ }
      }

      // Try to pair: need at least 2 entries
      const queueLen = await redisClient.llen(key);
      if (queueLen < 2) continue;

      // LPOP two entries atomically (sequential — good enough for MVP)
      const rawA = await redisClient.lpop(key);
      const rawB = await redisClient.lpop(key);
      if (!rawA || !rawB) continue;

      let entryA, entryB;
      try {
        entryA = JSON.parse(rawA);
        entryB = JSON.parse(rawB);
      } catch (e) {
        logger.error('Failed to parse queue entries', { rawA, rawB, e });
        continue;
      }

      const matchData = await createSession(entryA, entryB, mode, category);
      if (!matchData) continue; // scenario not found

      if (_io) {
        const emitBriefing = (userId, role, roleName, roleNameEn, briefing, briefingEn) => {
          _io.to(`user:${userId}`).emit('match_briefing', {
            sessionId: matchData.sessionId,
            role,
            roleName,
            roleNameEn,
            briefing,
            briefingEn,
            scenarioTitle: matchData.scenarioTitle,
            scenarioTitleEn: matchData.scenarioTitleEn,
            category: matchData.category,
            difficulty: matchData.difficulty,
            mode: matchData.mode,
            durationSeconds: matchData.durationSeconds,
            problem: matchData.problem,
            problemEn: matchData.problemEn,
            template: matchData.template,
            templateLanguage: matchData.templateLanguage,
          });
        };
        emitBriefing(matchData.userA.userId, 'role_a', matchData.roleAName, matchData.roleANameEn, matchData.briefingA, matchData.briefingAEn);
        emitBriefing(matchData.userB.userId, 'role_b', matchData.roleBName, matchData.roleBNameEn, matchData.briefingB, matchData.briefingBEn);
      }
    }
  } catch (err) {
    logger.error('Error in findMatch interval', err);
  }
};

module.exports = {
  joinQueue,
  leaveQueue,
  getQueueStatus,
  findMatch,
  setIo,
};
