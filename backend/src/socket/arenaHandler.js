'use strict';

const pool = require('../db/mysql');
const logger = require('../utils/logger');
const aiService = require('../services/aiService');
const eloService = require('../services/eloService');
const aiBotService = require('../services/aiBotService');

// ─── briefing formatter for PvP sessions ──────────────────────────────────────

/**
 * Build a system-briefing message shown in chat when a PvP session starts.
 * Each user gets ONLY their own role's briefing — never the opponent's.
 * Secret objectives are NEVER included (used only during AI scoring).
 */
const formatBriefingMessage = (session, role) => {
  const isRoleA = role === 'role_a';
  const roleName = isRoleA ? (session.role_a_name || 'Peran A') : (session.role_b_name || 'Peran B');
  const opponentName = isRoleA ? (session.role_b_name || 'Peran B') : (session.role_a_name || 'Peran A');
  const briefing = isRoleA ? session.role_a_briefing : session.role_b_briefing;
  const difficultyLabels = { beginner: 'Pemula', intermediate: 'Menengah', advanced: 'Lanjutan' };
  const difficulty = difficultyLabels[session.difficulty] || session.difficulty || '-';

  let text = `📋 **${session.scenario_title}**\n`;
  text += `Kategori: \`${session.category || '-'}\` · Mode: \`${session.mode === 'duel' ? '⚔️ Duel' : '🤝 Co-op'}\` · Level: \`${difficulty}\``;
  text += `\n\n---\n\n`;
  text += `**Peran kamu: ${roleName}**\n\n${briefing}`;

  if (session.has_problem && session.initial_content) {
    const problem = typeof session.initial_content === 'object'
      ? session.initial_content.problem
      : null;
    if (problem) {
      text += `\n\n---\n\n**🗂️ Problem:**\n${problem}`;
    }
  }

  text += `\n\n---\n\n*Kamu berpasangan dengan user lain yang memainkan peran **${opponentName}** — dia tidak tahu briefing kamu, kamu juga tidak tahu briefing dia. Tetap in-character selama sesi. Semangat!*`;

  return text;
};

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Fetch session + scenario in one join. Returns null if not found. */
const getSessionWithScenario = async (sessionId) => {
  const [rows] = await pool.query(
    `SELECT
       s.id, s.scenario_id, s.mode,
       s.user_a_id, s.user_b_id,
       s.user_a_role, s.user_b_role,
       s.chat_transcript,
       s.status, s.started_at,
        sc.duration_seconds,
        sc.title AS scenario_title,
        sc.role_a_briefing, sc.role_a_secret_objective,
        sc.role_b_briefing, sc.role_b_secret_objective,
        sc.ai_criteria, sc.resource_links, sc.tags,
        sc.workspace_type, sc.initial_content,
        sc.skill_category, sc.has_problem
     FROM sessions s
     LEFT JOIN scenarios sc ON s.scenario_id = sc.id
     WHERE s.id = ?`,
    [sessionId]
  );
  return rows[0] || null;
};

/**
 * Return only the briefing fields the requesting user is allowed to see.
 * Never leak the opponent's briefing — scenario integrity depends on this.
 */
const filterBriefingForRole = (session, role) => {
  if (role === 'role_a') {
    return {
      role: 'role_a',
      briefing: session.role_a_briefing,
      secretObjective: session.role_a_secret_objective,
    };
  }
  return {
    role: 'role_b',
    briefing: session.role_b_briefing,
    secretObjective: session.role_b_secret_objective,
  };
};

/** Determine which role a userId holds in the session. Returns null if not a participant. */
const resolveRole = (session, userId) => {
  if (session.user_a_id === userId) return session.user_a_role || 'role_a';
  if (session.user_b_id === userId) return session.user_b_role || 'role_b';
  return null;
};

// ─── per-room state tracking ──────────────────────────────────────────────────
// Map<sessionId, Set<userId>>
const readyMap = new Map();

// Map<sessionId, NodeJS.Timeout>  — server-side arena timers
const arenaTimers = new Map();

// Map<sessionId, Set<userId>>  — tracks who sent arena:finish (for duel)
const finishedMap = new Map();

const clearArenaTimer = (sessionId) => {
  const t = arenaTimers.get(sessionId);
  if (t) { clearTimeout(t); arenaTimers.delete(sessionId); }
};

// ─── scoring helper ───────────────────────────────────────────────────────────

const parseJsonSafe = (val) => {
  if (!val || typeof val !== 'string') return val ?? null;
  try { return JSON.parse(val); } catch (_) { return val; }
};

/**
 * Pull latest session state from DB (transcript may have grown), run AI scoring,
 * persist results, emit arena:scored to both players.
 * Runs fully async — never awaited by the caller so it never blocks socket events.
 */
const runScoringAsync = async (io, sessionId) => {
  try {
    logger.info(`AI scoring started | session=${sessionId}`);

    const [sessionRows] = await pool.query(
      `SELECT s.*, sc.title, sc.duration_seconds,
              sc.role_a_briefing, sc.role_a_secret_objective,
              sc.role_b_briefing, sc.role_b_secret_objective,
              sc.ai_criteria, sc.resource_links, sc.tags
       FROM sessions s
       LEFT JOIN scenarios sc ON s.scenario_id = sc.id
       WHERE s.id = ?`,
      [sessionId]
    );
    const row = sessionRows[0];
    if (!row) return;

    // Parse all JSON fields before passing to aiService
    const session = {
      ...row,
      chat_transcript: parseJsonSafe(row.chat_transcript) ?? [],
      workspace_content: parseJsonSafe(row.workspace_content) ?? null,
    };
    const scenario = {
      ...row,
      ai_criteria: parseJsonSafe(row.ai_criteria) ?? {},
      initial_content: parseJsonSafe(row.initial_content) ?? null,
    };

    const result = await aiService.scoreSession(session, scenario);

    if (session.mode === 'coop') {
      const { teamResult } = result;
      await pool.query(
        `UPDATE sessions SET team_score = ?, team_ai_feedback = ? WHERE id = ?`,
        [teamResult.score, JSON.stringify(teamResult), sessionId]
      );
      io.to(`session:${sessionId}`).emit('arena:scored', {
        sessionId,
        mode: 'coop',
        teamResult,
      });
    } else {
      const { userAResult, userBResult } = result;
      await pool.query(
        `UPDATE sessions SET
           user_a_score = ?, user_a_ai_feedback = ?,
           user_b_score = ?, user_b_ai_feedback = ?
         WHERE id = ?`,
        [
          userAResult.score, JSON.stringify(userAResult),
          userBResult.score, JSON.stringify(userBResult),
          sessionId,
        ]
      );

      // Emit personalised result to each player
      const { user_a_id, user_b_id } = row;
      io.to(`user:${user_a_id}`).emit('arena:scored', { sessionId, mode: 'duel', myResult: userAResult });
      io.to(`user:${user_b_id}`).emit('arena:scored', { sessionId, mode: 'duel', myResult: userBResult });

      // ── ELO update (duel only) ──────────────────────────────────────────────
      // Re-read updated scores from DB to be safe (avoids stale closure values)
      try {
        const [[fresh]] = await pool.query(
          'SELECT user_a_score, user_b_score, category, skill_category FROM sessions s LEFT JOIN scenarios sc ON s.scenario_id = sc.id WHERE s.id = ?',
          [sessionId]
        );
        if (fresh) {
          const { SKILL_CATEGORIES } = require('../utils/constants');
          // Prefer skill_category column (set by seed runner), fall back to slug mapping
          let skillCategory = fresh.skill_category;
          if (!skillCategory || !SKILL_CATEGORIES.includes(skillCategory)) {
            const categorySlugToEnum = {
              'architecture':            'SYSTEM_DESIGN',
              'technical-communication': 'TECHNICAL_COMMUNICATION',
              'debugging':               'DEBUGGING',
              'negotiation':             'NEGOTIATION',
              'stakeholder-management':  'STAKEHOLDER_MANAGEMENT',
              'career-growth':           'MENTORING',
              'interview-prep':          'INTERVIEW_PREP',
            };
            skillCategory = categorySlugToEnum[fresh.category] ?? fresh.category?.toUpperCase();
          }
          if (SKILL_CATEGORIES.includes(skillCategory)) {
            const eloRow = { user_a_id, user_b_id, user_a_score: fresh.user_a_score, user_b_score: fresh.user_b_score };
            await eloService.processEloForSession(eloRow, skillCategory);
          }
        }
      } catch (eloErr) {
        // Non-fatal — scoring succeeded, ELO failure should not bubble up
        logger.error(`ELO update failed | session=${sessionId}`, { error: eloErr.message });
      }
    }

    logger.info(`AI scoring complete | session=${sessionId}`);
  } catch (err) {
    logger.error(`AI scoring failed | session=${sessionId}`, { error: err.message });
  }
};

// ─── handler factory ──────────────────────────────────────────────────────────

const registerArenaHandler = (io, socket) => {
  const userId = socket.data.userId;

  // ── arena:join ─────────────────────────────────────────────────────────────
  socket.on('arena:join', async ({ sessionId } = {}) => {
    try {
      if (!sessionId) return socket.emit('arena:error', { message: 'sessionId is required' });

      const session = await getSessionWithScenario(sessionId);
      if (!session) return socket.emit('arena:error', { message: 'Session not found' });

      const role = resolveRole(session, userId);
      if (!role) return socket.emit('arena:error', { message: 'You are not a participant in this session' });

      // Join socket.io room
      const roomName = `session:${sessionId}`;
      socket.join(roomName);
      socket.data.sessionId = sessionId;
      socket.data.role = role;

      // Parse JSON fields that may arrive as strings from MySQL
      const parseJson = (val) => {
        if (!val || typeof val !== 'string') return val;
        try { return JSON.parse(val); } catch (_) { return val; }
      };

      // Send ONLY the requesting user's briefing — never the opponent's
      const myBriefing = filterBriefingForRole(session, role);

      const isBotOpponent = session.user_b_id === aiBotService.BOT_USER_ID;

      // Parse workspace info
      const workspaceType = session.workspace_type || 'chat';
      const initialContent = parseJsonSafe(session.initial_content) || null;

      socket.emit('arena:joined', {
        sessionId,
        role: myBriefing.role,
        briefing: myBriefing.briefing,
        secretObjective: myBriefing.secretObjective,
        scenarioTitle: session.scenario_title,
        mode: session.mode,
        durationSeconds: session.duration_seconds,
        aiCriteria: parseJson(session.ai_criteria),
        resourceLinks: parseJson(session.resource_links),
        tags: parseJson(session.tags),
        status: session.status,
        startedAt: session.started_at,
        isBotOpponent,
        workspaceType,
        initialContent,
        skillCategory: session.skill_category || null,
        hasProblem: !!session.has_problem,
      });

      logger.info(`arena:join | user=${userId} role=${role} session=${sessionId}`);
    } catch (err) {
      logger.error('arena:join error', err);
      socket.emit('arena:error', { message: 'Failed to join arena' });
    }
  });

  // ── arena:ready ────────────────────────────────────────────────────────────
  socket.on('arena:ready', async () => {
    try {
      const sessionId = socket.data.sessionId;
      if (!sessionId) return socket.emit('arena:error', { message: 'Join arena first' });

      const session = await getSessionWithScenario(sessionId);
      if (!session) return;

      const isBotSession = session.user_b_id === aiBotService.BOT_USER_ID;

      if (!readyMap.has(sessionId)) readyMap.set(sessionId, new Set());
      readyMap.get(sessionId).add(userId);

      // Bot is always ready
      if (isBotSession) {
        readyMap.get(sessionId).add(aiBotService.BOT_USER_ID);
      }

      const participantCount = 2;
      const readyCount = readyMap.get(sessionId).size;

      logger.info(`arena:ready | user=${userId} session=${sessionId} (${readyCount}/${participantCount} ready)`);

      if (readyCount >= participantCount) {
        readyMap.delete(sessionId);

        // Update session status → in_progress + record started_at
        await pool.query(
          `UPDATE sessions SET status = 'in_progress', started_at = NOW() WHERE id = ? AND status = 'waiting'`,
          [sessionId]
        );

        const startedAt = new Date().toISOString();

        io.to(`session:${sessionId}`).emit('arena:started', {
          sessionId,
          startedAt,
          durationSeconds: session.duration_seconds,
          isBotOpponent: isBotSession,
        });

        // ── send private briefing to each user (PvP only) ───────────────────
        if (!isBotSession) {
          const briefingA = formatBriefingMessage(session, 'role_a');
          const briefingB = formatBriefingMessage(session, 'role_b');

          if (session.user_a_id) {
            io.to(`user:${session.user_a_id}`).emit('arena:briefing', {
              sessionId,
              role: 'role_a',
              text: briefingA,
            });
          }
          if (session.user_b_id) {
            io.to(`user:${session.user_b_id}`).emit('arena:briefing', {
              sessionId,
              role: 'role_b',
              text: briefingB,
            });
          }
        }

        logger.info(`arena:started | session=${sessionId} durationSeconds=${session.duration_seconds}`);

        // ── server-side arena timeout ────────────────────────────────────────
        clearArenaTimer(sessionId);
        const timer = setTimeout(async () => {
          try {
            await pool.query(
              `UPDATE sessions SET status = 'completed', ended_at = NOW() WHERE id = ? AND status = 'in_progress'`,
              [sessionId]
            );
            io.to(`session:${sessionId}`).emit('arena:timeout', {
              sessionId,
              message: 'Time is up! The session has ended.',
              endedAt: new Date().toISOString(),
            });
            arenaTimers.delete(sessionId);
            logger.info(`arena:timeout | session=${sessionId} auto-completed`);

            // Trigger AI scoring async — does not block the timeout event
            runScoringAsync(io, sessionId);
          } catch (err) {
            logger.error('arena:timeout update error', err);
          }
        }, session.duration_seconds * 1000);

        arenaTimers.set(sessionId, timer);
      }
    } catch (err) {
      logger.error('arena:ready error', err);
      socket.emit('arena:error', { message: 'Failed to process ready signal' });
    }
  });

  // ── arena:message ──────────────────────────────────────────────────────────
  socket.on('arena:message', async ({ text } = {}) => {
    try {
      const sessionId = socket.data.sessionId;
      if (!sessionId) return socket.emit('arena:error', { message: 'Join arena first' });
      if (!text || typeof text !== 'string') return socket.emit('arena:error', { message: 'text is required' });

      const trimmed = text.trim().slice(0, 4000); // hard cap
      const messageEntry = {
        userId,
        role: socket.data.role,
        text: trimmed,
        ts: new Date().toISOString(),
      };

      // Append to chat_transcript using MySQL JSON_ARRAY_APPEND — no read-modify-write round trip
      await pool.query(
        `UPDATE sessions
         SET chat_transcript = JSON_ARRAY_APPEND(
           COALESCE(chat_transcript, JSON_ARRAY()),
           '$',
           CAST(? AS JSON)
         )
         WHERE id = ?`,
        [JSON.stringify(messageEntry), sessionId]
      );

      // Broadcast to whole room (sender included so they get server confirmation)
      io.to(`session:${sessionId}`).emit('arena:message', messageEntry);

      // ── AI bot response ─────────────────────────────────────────────────
      // If opponent is the AI bot, generate a response after a short delay
      const session = await getSessionWithScenario(sessionId);
      if (session && session.user_b_id === aiBotService.BOT_USER_ID) {
        const botRole = session.user_b_role || 'role_b';
        const botBriefing = botRole === 'role_a' ? session.role_a_briefing : session.role_b_briefing;
        const botSecretObj = botRole === 'role_a' ? session.role_a_secret_objective : session.role_b_secret_objective;

        // Simulate typing delay (1-3 seconds)
        const delay = 1000 + Math.random() * 2000;
        setTimeout(async () => {
          try {
            const [row] = await pool.query(
              'SELECT chat_transcript FROM sessions WHERE id = ?', [sessionId]
            );
            const transcript = parseJsonSafe(row[0]?.chat_transcript) ?? [];

            const reply = await aiBotService.generateResponse(
              botBriefing, botSecretObj, session.scenario_title, transcript
            );
            if (!reply) return;

            const botMsg = {
              userId: aiBotService.BOT_USER_ID,
              role: botRole,
              text: reply.slice(0, 2000),
              ts: new Date().toISOString(),
            };

            await pool.query(
              `UPDATE sessions
               SET chat_transcript = JSON_ARRAY_APPEND(
                 COALESCE(chat_transcript, JSON_ARRAY()),
                 '$',
                 CAST(? AS JSON)
               )
               WHERE id = ?`,
              [JSON.stringify(botMsg), sessionId]
            );

            io.to(`session:${sessionId}`).emit('arena:message', botMsg);
          } catch (err) {
            logger.error('AI bot response error', { error: err.message, sessionId });
          }
        }, delay);
      }
    } catch (err) {
      logger.error('arena:message error', err);
      socket.emit('arena:error', { message: 'Failed to send message' });
    }
  });

  // ── arena:code-change ──────────────────────────────────────────────────────
  // Relay only — do NOT persist per-keystroke, expensive and unnecessary for MVP
  socket.on('arena:code-change', ({ code } = {}) => {
    const sessionId = socket.data.sessionId;
    if (!sessionId || typeof code !== 'string') return;

    // Broadcast to room except the sender
    socket.to(`session:${sessionId}`).emit('arena:code-sync', {
      code,
      from: userId,
      role: socket.data.role,
    });
  });

  // ── arena:workspace-change ──────────────────────────────────────────────────
  // Persist workspace content (final version saved when user finishes)
  socket.on('arena:workspace-change', async ({ content, role } = {}) => {
    try {
      const sessionId = socket.data.sessionId;
      if (!sessionId || typeof content !== 'string') return;

      // Store in session's workspace_content JSON
      const [existing] = await pool.query(
        'SELECT workspace_content FROM sessions WHERE id = ?', [sessionId]
      );
      const wsContent = parseJsonSafe(existing[0]?.workspace_content) || {};
      wsContent[role || socket.data.role] = content;

      await pool.query(
        'UPDATE sessions SET workspace_content = ? WHERE id = ?',
        [JSON.stringify(wsContent), sessionId]
      );

      // Broadcast to room
      io.to(`session:${sessionId}`).emit('arena:workspace-sync', {
        content,
        from: userId,
        role: socket.data.role,
      });
    } catch (err) {
      logger.error('arena:workspace-change error', err);
    }
  });

  // ── arena:finish ───────────────────────────────────────────────────────────
  socket.on('arena:finish', async () => {
    try {
      const sessionId = socket.data.sessionId;
      if (!sessionId) return;

      socket.to(`session:${sessionId}`).emit('arena:opponent-finished', {
        userId,
        role: socket.data.role,
      });

      logger.info(`arena:finish | user=${userId} session=${sessionId}`);

      const session = await getSessionWithScenario(sessionId);
      if (!session) return;

      // Bot sessions: human finishes → auto-complete immediately
      const isBotSession = session.user_b_id === aiBotService.BOT_USER_ID;
      if (isBotSession) {
        clearArenaTimer(sessionId);
        await pool.query(
          `UPDATE sessions SET status = 'completed', ended_at = NOW() WHERE id = ? AND status = 'in_progress'`,
          [sessionId]
        );
        io.to(`session:${sessionId}`).emit('arena:timeout', {
          sessionId,
          message: 'Session complete!',
          endedAt: new Date().toISOString(),
        });
        runScoringAsync(io, sessionId);
        return;
      }

      // Track finished players; when both finish early → score immediately
      if (!finishedMap.has(sessionId)) finishedMap.set(sessionId, new Set());
      finishedMap.get(sessionId).add(userId);

      const bothDone = finishedMap.get(sessionId).size >= 2;
      if (bothDone) {
        finishedMap.delete(sessionId);
        clearArenaTimer(sessionId); // cancel timeout timer — we're done early

        await pool.query(
          `UPDATE sessions SET status = 'completed', ended_at = NOW() WHERE id = ? AND status = 'in_progress'`,
          [sessionId]
        );
        io.to(`session:${sessionId}`).emit('arena:timeout', {
          sessionId,
          message: 'Both players finished. Session complete!',
          endedAt: new Date().toISOString(),
        });

        // Trigger AI scoring async
        runScoringAsync(io, sessionId);
      }
    } catch (err) {
      logger.error('arena:finish error', err);
    }
  });

  // ── arena:report ───────────────────────────────────────────────────────────
  socket.on('arena:report', ({ reason } = {}) => {
    const sessionId = socket.data.sessionId;
    logger.warn(`arena:report | session=${sessionId} reporter=${userId} reason=${reason || 'no reason given'}`);
    // TODO: persist to a reports table when moderation feature is built
    socket.emit('arena:report-received', { message: 'Report logged. Our team will review it.' });
  });

  // ── disconnect ─────────────────────────────────────────────────────────────
  socket.on('disconnect', (reason) => {
    const sessionId = socket.data.sessionId;

    if (sessionId) {
      socket.to(`session:${sessionId}`).emit('arena:opponent-left', {
        userId,
        role: socket.data.role,
        reason,
      });
      logger.info(`disconnect | user=${userId} session=${sessionId} reason=${reason}`);
    }

    // Clean up ready state if user disconnects before game starts
    if (sessionId && readyMap.has(sessionId)) {
      readyMap.get(sessionId).delete(userId);
      if (readyMap.get(sessionId).size === 0) readyMap.delete(sessionId);
    }
  });
};

module.exports = { registerArenaHandler };
