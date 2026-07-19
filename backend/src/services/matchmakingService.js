'use strict';

const { v4: uuidv4 } = require('uuid');
const redisClient = require('../db/redis');
const pool = require('../db/mysql');
const logger = require('../utils/logger');

const QUEUE_TTL_SECONDS = 300; // 5 min hard max before Redis auto-cleans
const MATCH_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

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
 * Build a bilingual (ID + EN) private briefing for one participant.
 * Secret objectives are NEVER included.
 * Uses Indonesian columns first, falls back to English.
 */
const formatBriefing = (scenario, role) => {
  const isRoleA = role === 'role_a';
  const titleId = scenario.title_id || scenario.title;
  const roleNameId = isRoleA
    ? (scenario.role_a_name_id || scenario.role_a_name || 'Peran A')
    : (scenario.role_b_name_id || scenario.role_b_name || 'Peran B');
  const roleNameEn = isRoleA
    ? (scenario.role_a_name || scenario.role_a_name_id || 'Role A')
    : (scenario.role_b_name || scenario.role_b_name_id || 'Role B');
  const briefingId = isRoleA
    ? (scenario.role_a_briefing_id || scenario.role_a_briefing || '')
    : (scenario.role_b_briefing_id || scenario.role_b_briefing || '');
  const briefingEn = isRoleA
    ? (scenario.role_a_briefing || scenario.role_a_briefing_id || '')
    : (scenario.role_b_briefing || scenario.role_b_briefing_id || '');
  const diff = difficultyLabels[scenario.difficulty] || scenario.difficulty || '-';
  const diffEn = scenario.difficulty || '-';
  const modeId = scenario.mode === 'duel' ? '⚔️ Duel' : '🤝 Co-op';
  const modeEn = scenario.mode === 'duel' ? 'Duel' : 'Co-op';

  return `📋 **${titleId}**
Kategori: \`${scenario.category || '-'}\` · Mode: \`${modeId}\` · Level: \`${diff}\`

---

**🇮🇩 Peran kamu: ${roleNameId}**

${briefingId}

---

**🇬🇧 Your Role: ${roleNameEn}**
Category: \`${scenario.category || '-'}\` · Mode: \`${modeEn}\` · Level: \`${diffEn}\`

${briefingEn}`;
};

/**
 * Build a bilingual start hint (chat-only, no workspace).
 */
const formatStartHint = (scenario) => {
  const aNameId = scenario.role_a_name_id || scenario.role_a_name || 'Peran A';
  const aNameEn = scenario.role_a_name || scenario.role_a_name_id || 'Role A';
  const bNameId = scenario.role_b_name_id || scenario.role_b_name || 'Peran B';
  const bNameEn = scenario.role_b_name || scenario.role_b_name_id || 'Role B';

  if (scenario.mode === 'coop') {
    return `🇮🇩 ${aNameId} dan ${bNameId}, silakan mulai diskusi untuk menyelesaikan situasi ini bersama.

🇬🇧 ${aNameEn} and ${bNameEn}, please start discussing to solve this situation together.`;
  }
  return `🇮🇩 ${aNameId}, silakan mulai percakapan sesuai skenario kamu.

🇬🇧 ${aNameEn}, please start the conversation according to your scenario.`;
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

  // Start hint (no targetRole — visible to both)
  const hintText = formatStartHint(scenario);
  await appendMessage(sessionId, { userId: 'system', role: 'system', text: hintText, ts: now });

  return {
    sessionId,
    scenarioId: scenario.id,
    mode,
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
        _io.to(`user:${matchData.userA.userId}`).emit('match:found', matchData);
        _io.to(`user:${matchData.userB.userId}`).emit('match:found', matchData);
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
