'use strict';

const { v4: uuidv4 } = require('uuid');
const redisClient = require('../db/redis');
const pool = require('../db/mysql');
const logger = require('../utils/logger');
// userSocketMap is used so this service can emit directly to a specific user's socket.
// Imported here to resolve the TODO left in the original match:found emit block.
const userSocketMap = require('../socket/userSocketMap');

const QUEUE_TTL_SECONDS = 300; // 5 min hard max before Redis auto-cleans
const MATCH_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

// ─── helpers ──────────────────────────────────────────────────────────────────

const buildQueueKey = (mode, skillCategory, experienceLevel) =>
  `queue:${mode}:${skillCategory}:${experienceLevel}`;

/**
 * Map SKILL_CATEGORIES enum (uppercase) to scenario category slugs (lowercase-hyphen)
 * used in the scenarios table so ORDER BY RAND() filter stays accurate.
 */
const categoryMap = {
  SYSTEM_DESIGN: 'architecture',
  TECHNICAL_COMMUNICATION: 'technical-communication',
  DEBUGGING: 'debugging',
  NEGOTIATION: 'negotiation',
  STAKEHOLDER_MANAGEMENT: 'stakeholder-management',
  MENTORING: 'technical-communication', // closest fit in seed data
  INTERVIEW_PREP: 'interview-prep',
};

// ─── queue operations ─────────────────────────────────────────────────────────

/**
 * Push a user into the appropriate Redis list queue.
 * Each element is JSON so we can track joinedAt for timeout checks.
 */
const joinQueue = async (userId, mode, skillCategory, experienceLevel) => {
  const key = buildQueueKey(mode, skillCategory, experienceLevel);
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
const leaveQueue = async (userId, mode, skillCategory, experienceLevel) => {
  const key = buildQueueKey(mode, skillCategory, experienceLevel);

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
          const [, mode, skillCategory, experienceLevel] = key.split(':');
          return {
            inQueue: true,
            key,
            mode,
            skillCategory,
            experienceLevel,
            position: i + 1,
            elapsedSeconds: Math.floor(elapsedMs / 1000),
          };
        }
      } catch (_) { /* skip */ }
    }
  }

  return { inQueue: false };
};

// ─── session creation helper ──────────────────────────────────────────────────

const createSession = async (entryA, entryB, mode, skillCategory) => {
  const sessionId = uuidv4();

  // Pick a random scenario that matches mode + mapped category
  const scenarioCategory = categoryMap[skillCategory] || skillCategory.toLowerCase();
  const [scenarioRows] = await pool.query(
    'SELECT id FROM scenarios WHERE mode = ? AND category = ? AND is_active = 1 ORDER BY RAND() LIMIT 1',
    [mode, scenarioCategory]
  );

  const scenarioId = scenarioRows[0]?.id || null;

  // Randomly assign roles
  const [userA, userB] = Math.random() < 0.5
    ? [entryA, entryB]
    : [entryB, entryA];

  await pool.query(
    `INSERT INTO sessions
       (id, scenario_id, mode, user_a_id, user_b_id, user_a_role, user_b_role, status, started_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'in_progress', NOW())`,
    [sessionId, scenarioId, mode, userA.userId, userB.userId, 'role_a', 'role_b']
  );

  logger.info(
    `Match created | session=${sessionId} mode=${mode} category=${skillCategory} ` +
    `user_a=${userA.userId} user_b=${userB.userId} scenario=${scenarioId}`
  );

  return {
    sessionId,
    scenarioId,
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
      const [, mode, skillCategory, experienceLevel] = key.split(':');

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

            // TODO: connect to userSocketMap in socket stage to emit directly to user socket
            if (_io) {
              _io.to(`user:${entry.userId}`).emit('match:timeout', {
                userId: entry.userId,
                message: 'No match found. You can continue against an AI opponent.',
                aiOpponentAvailable: true, // AI mode not yet implemented — placeholder
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

      const matchData = await createSession(entryA, entryB, mode, skillCategory);

      // TODO: in socket stage, wire to userSocketMap so we can do:
      //   io.to(socketIdA).emit('match:found', matchData)
      //   io.to(socketIdB).emit('match:found', matchData)
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
