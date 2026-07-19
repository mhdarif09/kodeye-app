'use strict';

const Groq = require('groq-sdk');
const config = require('../config/env');
const logger = require('../utils/logger');

const groq = new Groq({
  apiKey: config.groq.apiKey,
  timeout: 30000, // 30s — don't let a slow API response hang the scoring forever
});

// Model note: llama-3.3-70b-versatile supports response_format json_object on Groq.
// If Groq adds llama-4 or a newer 70B+ variant in future, swap MODEL constant here.
const MODEL = 'llama-3.3-70b-versatile';
const MAX_TOKENS = 1024;

// ─── prompt builders ──────────────────────────────────────────────────────────

const buildSystemPrompt = () => `
You are an expert soft-skill evaluator for a developer role-play training platform.
You will be given a chat transcript of a role-play scenario, the evaluation criteria,
and the secret objectives for each role.

YOUR RESPONSE MUST BE A SINGLE, VALID JSON OBJECT — NO markdown, NO prose, NO fences.

Required JSON shape:
{
  "score": <integer 0-100>,
  "breakdown": { "<criteriaName>": <integer 0-max for that criterion> },
  "detectedSkills": ["<skill>", ...],
  "improvements": ["<specific improvement suggestion>", ...],
  "secretObjectiveMet": <true|false>,
  "secretObjectiveFeedback": "<1-2 sentences on how well the secret objective was handled>"
}

Rules:
- "score" is the weighted sum of "breakdown" values (sum of max values = 100).
- "breakdown" keys must match the ai_criteria keys exactly.
- "detectedSkills" are concrete soft/technical skills clearly demonstrated.
- "improvements" must be actionable and specific (max 4 items).
- "secretObjectiveMet" is true only if the player clearly executed the secret objective.
`.trim();

const buildUserPromptDuel = (role, briefing, secretObjective, aiCriteria, transcript, workspaceContent) => {
  const criteriaDesc = Object.entries(aiCriteria)
    .map(([k, v]) => `  - ${k}: max ${v} points`)
    .join('\n');

  const chatLines = transcript
    .filter((m) => m.role === role || m.role === (role === 'role_a' ? 'role_b' : 'role_a'))
    .map((m) => `[${m.role.toUpperCase()} | ${m.ts}]: ${m.text}`)
    .join('\n');

  const wsSection = workspaceContent
    ? `\n## WORKSPACE OUTPUT (submitted by ${role.toUpperCase()}):\n${workspaceContent}\n`
    : '';

  return `
## ROLE BEING EVALUATED: ${role.toUpperCase()}

## ROLE BRIEFING (what this player was told):
${briefing}

## SECRET OBJECTIVE (known only to evaluator):
${secretObjective}

## EVALUATION CRITERIA (sum = 100):
${criteriaDesc}

## CHAT TRANSCRIPT:
${chatLines || '(no messages recorded)'}
${wsSection}
Evaluate ${role.toUpperCase()}'s performance only. Score fairly based on the transcript evidence.
If workspace output is present, evaluate the technical quality of the solution as well.
`.trim();
};

const buildUserPromptCoop = (scenarioTitle, aiCriteria, secretObjA, secretObjB, transcript, workspaceContent) => {
  const criteriaDesc = Object.entries(aiCriteria)
    .map(([k, v]) => `  - ${k}: max ${v} points`)
    .join('\n');

  const chatLines = transcript
    .map((m) => `[${m.role.toUpperCase()} | ${m.ts}]: ${m.text}`)
    .join('\n');

  const wsSection = workspaceContent
    ? `\n## WORKSPACE OUTPUT:\n${typeof workspaceContent === 'string' ? workspaceContent : JSON.stringify(workspaceContent)}\n`
    : '';

  return `
## SCENARIO: ${scenarioTitle}
## MODE: COOPERATIVE (evaluate the team as one unit)

## SECRET OBJECTIVES:
- Role A: ${secretObjA}
- Role B: ${secretObjB}

## EVALUATION CRITERIA (sum = 100):
${criteriaDesc}

## CHAT TRANSCRIPT:
${chatLines || '(no messages recorded)'}
${wsSection}
Evaluate the TEAM'S combined performance. "secretObjectiveMet" is true only if BOTH secret objectives were clearly executed.
If workspace output is present, evaluate the technical quality of the team's solution.
`.trim();
};

// ─── core call ────────────────────────────────────────────────────────────────

/**
 * Strip markdown code fences that some models still emit despite instructions.
 *   ```json\n{...}\n```  →  {...}
 */
const stripFences = (raw) => raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

/**
 * Call Groq and return parsed JSON. Retries once if first parse fails.
 * @param {string} userPrompt
 * @returns {Promise<object>}
 */
const callGroq = async (userPrompt) => {
  const requestPayload = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: userPrompt },
    ],
  };

  let rawContent;
  try {
    const completion = await groq.chat.completions.create(requestPayload);
    rawContent = completion.choices[0]?.message?.content ?? '';
  } catch (err) {
    logger.error('Groq API call failed', { error: err.message });
    throw err;
  }

  // Attempt 1
  try {
    return JSON.parse(stripFences(rawContent));
  } catch (_) {
    logger.warn('Groq response JSON parse failed on first attempt, retrying...');
  }

  // Retry once — ask model to fix its own output
  try {
    const retryCompletion = await groq.chat.completions.create({
      ...requestPayload,
      messages: [
        ...requestPayload.messages,
        { role: 'assistant', content: rawContent },
        {
          role: 'user',
          content: 'Your previous response was not valid JSON. Return ONLY the JSON object, nothing else.',
        },
      ],
    });
    const retryContent = retryCompletion.choices[0]?.message?.content ?? '';
    return JSON.parse(stripFences(retryContent));
  } catch (retryErr) {
    logger.error('Groq retry also failed to produce valid JSON', { error: retryErr.message, rawContent });
    throw new Error('AI scoring failed: could not parse Groq response after retry');
  }
};

// ─── public API ───────────────────────────────────────────────────────────────

/**
 * Score a completed session.
 *
 * @param {object} session  - full session row (with chat_transcript already parsed)
 * @param {object} scenario - full scenario row (with ai_criteria already parsed)
 * @returns {Promise<{ userAResult, userBResult } | { teamResult }>}
 */
const scoreSession = async (session, scenario) => {
  const {
    mode,
    chat_transcript: transcript = [],
    user_a_role,
    user_b_role,
    workspace_content: wsContent,
  } = session;

  const {
    title,
    ai_criteria,
    role_a_briefing,
    role_a_secret_objective,
    role_b_briefing,
    role_b_secret_objective,
  } = scenario;

  if (mode === 'coop') {
    const combinedWs = wsContent
      ? Object.values(wsContent).filter(Boolean).join('\n\n---\n\n')
      : null;
    logger.info(`AI scoring (coop) | session=${session.id}`);
    const teamResult = await callGroq(
      buildUserPromptCoop(title, ai_criteria, role_a_secret_objective, role_b_secret_objective, transcript, combinedWs)
    );
    return { teamResult };
  }

  // DUEL — score each player independently
  logger.info(`AI scoring (duel) | session=${session.id} — scoring role_a`);
  const userAResult = await callGroq(
    buildUserPromptDuel('role_a', role_a_briefing, role_a_secret_objective, ai_criteria, transcript, wsContent?.role_a)
  );

  logger.info(`AI scoring (duel) | session=${session.id} — scoring role_b`);
  const userBResult = await callGroq(
    buildUserPromptDuel('role_b', role_b_briefing, role_b_secret_objective, ai_criteria, transcript, wsContent?.role_b)
  );

  return { userAResult, userBResult };
};

module.exports = { scoreSession };
