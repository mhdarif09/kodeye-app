'use strict';

const logger = require('../utils/logger');

/**
 * Heuristic-based session scorer (no external AI dependency).
 * Scores participation, effort, session duration, and conversation balance.
 */

const scoreSession = async (session, scenario) => {
  const {
    id: sessionId,
    mode,
    chat_transcript: transcript = [],
    started_at,
    ended_at,
    user_a_role,
    user_b_role,
    workspace_content: wsContent,
  } = session;

  const {
    ai_criteria,
  } = scenario;

  const durationSeconds = session.duration_seconds || 600;
  const totalDuration = started_at && ended_at
    ? (new Date(ended_at) - new Date(started_at)) / 1000
    : durationSeconds;
  const durationRatio = Math.min(1, Math.max(0, totalDuration / durationSeconds));
  const systemMessages = transcript.filter(m => m.role === 'system');
  const chatMessages = transcript.filter(m => m.role !== 'system');

  if (mode === 'coop') {
    const teamResult = evaluateTeam(chatMessages, ai_criteria, durationRatio, mode);
    logger.info(`Heuristic scoring (coop) | session=${sessionId} score=${teamResult.score}`);
    return { teamResult };
  }

  const msgsA = chatMessages.filter(m => m.role === user_a_role);
  const msgsB = chatMessages.filter(m => m.role === user_b_role);

  const userAResult = evaluatePlayer(msgsA, msgsB, ai_criteria, durationRatio, mode, 'role_a');
  const userBResult = evaluatePlayer(msgsB, msgsA, ai_criteria, durationRatio, mode, 'role_b');

  logger.info(`Heuristic scoring (duel) | session=${sessionId} a=${userAResult.score} b=${userBResult.score}`);
  return { userAResult, userBResult };
};

const evaluatePlayer = (myMsgs, opponentMsgs, criteria, durationRatio, mode, role) => {
  const myCount = myMsgs.length;
  const totalMsgs = myCount + opponentMsgs.length;

  const avgLen = myCount > 0
    ? Math.round(myMsgs.reduce((s, m) => s + countWords(m.text), 0) / myCount)
    : 0;

  const maxWords = myCount > 0 ? Math.max(...myMsgs.map(m => countWords(m.text))) : 0;
  const minWords = myCount > 0 ? Math.min(...myMsgs.map(m => countWords(m.text))) : 0;

  const expectedMsgs = Math.max(4, Math.round(durationRatio * 10));

  const msgScore = Math.min(30, Math.round((myCount / expectedMsgs) * 30));

  const lenScore = avgLen >= 20 ? 30 : avgLen >= 10 ? 22 : avgLen >= 5 ? 12 : avgLen >= 2 ? 5 : 0;

  const durScore = Math.round(durationRatio * 20);

  const balance = totalMsgs > 0 ? myCount / totalMsgs : 0.5;
  const balanceScore = totalMsgs >= 3 ? Math.round((1 - Math.abs(balance - 0.5) * 2) * 20) : 10;

  const wordsPerMsgFactor = myCount > 0 ? Math.min(1, maxWords > 0 ? avgLen / Math.max(maxWords, 1) : 0) : 0;

  let rawScore = msgScore + lenScore + durScore + balanceScore;
  rawScore = Math.min(100, Math.max(10, rawScore));

  if (myCount === 0) rawScore = 0;

  const breakdown = {};
  const totalMax = Object.values(criteria).reduce((s, v) => s + v, 0) || 100;
  for (const [key, max] of Object.entries(criteria)) {
    breakdown[key] = Math.round((max / totalMax) * rawScore);
  }

  const skills = buildDetectedSkills(myMsgs, avgLen);
  const improvements = buildImprovements(myCount, avgLen, durationRatio, balance);

  return {
    score: rawScore,
    breakdown,
    detectedSkills: skills,
    improvements,
    secretObjectiveMet: false,
    secretObjectiveFeedback: '',
  };
};

const evaluateTeam = (chatMessages, criteria, durationRatio, mode) => {
  const msgCount = chatMessages.length;
  const avgLen = msgCount > 0
    ? Math.round(chatMessages.reduce((s, m) => s + countWords(m.text), 0) / msgCount)
    : 0;

  const expectedMsgs = Math.max(6, Math.round(durationRatio * 16));
  const msgScore = Math.min(30, Math.round((msgCount / expectedMsgs) * 30));
  const lenScore = avgLen >= 20 ? 30 : avgLen >= 10 ? 22 : avgLen >= 5 ? 12 : 0;
  const durScore = Math.round(durationRatio * 25);
  const collabScore = msgCount >= expectedMsgs ? 15 : Math.round((msgCount / expectedMsgs) * 15);

  let rawScore = Math.min(100, Math.max(10, msgScore + lenScore + durScore + collabScore));
  if (msgCount === 0) rawScore = 0;

  const breakdown = {};
  const totalMax = Object.values(criteria).reduce((s, v) => s + v, 0) || 100;
  for (const [key, max] of Object.entries(criteria)) {
    breakdown[key] = Math.round((max / totalMax) * rawScore);
  }

  return {
    score: rawScore,
    breakdown,
    detectedSkills: ['Collaboration', 'Communication'],
    improvements: avgLen < 10 ? ['Coba kembangkan jawaban lebih detail'] : ['Pertahankan kualitas diskusi'],
    secretObjectiveMet: false,
    secretObjectiveFeedback: '',
  };
};

const countWords = (text) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};

const buildDetectedSkills = (myMsgs, avgLen) => {
  const skills = [];
  if (myMsgs.length >= 6) skills.push('Active Participation');
  if (avgLen >= 20) skills.push('Detailed Communication');
  if (avgLen >= 10 && avgLen < 20) skills.push('Concise Communication');
  const hasCode = myMsgs.some(m => /```|`[a-z]+`/.test(m.text));
  if (hasCode) skills.push('Technical Communication');
  const hasQuestions = myMsgs.some(m => /\?/.test(m.text));
  if (hasQuestions) skills.push('Inquisitive');
  return skills.length > 0 ? skills.slice(0, 4) : ['Session Completed'];
};

const buildImprovements = (msgCount, avgLen, durationRatio, balance) => {
  const tips = [];
  if (msgCount < 4) tips.push('Kirim lebih banyak pesan untuk diskusi yang lebih aktif');
  if (avgLen < 10) tips.push('Kembangkan jawaban dengan penjelasan yang lebih detail');
  if (durationRatio < 0.5) tips.push('Manfaatkan waktu sesi lebih baik — jangan selesaikan terlalu cepat');
  if (balance < 0.3) tips.push('Seimbangkan partisipasi agar diskusi lebih natural');
  return tips.length > 0 ? tips.slice(0, 3) : ['Pertahankan performa — sesi berjalan dengan baik'];
};

module.exports = { scoreSession };
