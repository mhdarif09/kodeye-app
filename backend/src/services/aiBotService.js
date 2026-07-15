'use strict';

const Groq = require('groq-sdk');
const config = require('../config/env');
const logger = require('../utils/logger');

const groq = new Groq({ apiKey: config.groq.apiKey });
const MODEL = 'llama-3.3-70b-versatile';
const MAX_TOKENS = 256;

const BOT_USER_ID = '00000000-0000-0000-0000-000000000001';
const BOT_USERNAME = 'AI Lawan';

const buildBotPrompt = (briefing, secretObjective, scenarioTitle, transcript) => {
  const chatLog = transcript
    .map((m) => `[${m.role}]: ${m.text}`)
    .join('\n');

  return `
You are roleplaying as the opponent in a professional tech scenario.
Your character briefing: ${briefing}
${secretObjective ? `Your secret objective: ${secretObjective}` : ''}
Scenario: ${scenarioTitle}

Conversation so far:
${chatLog || '(no messages yet — you start the conversation)'}

Respond naturally as your character. Keep responses concise (1-3 sentences). Stay in character.
Do NOT include any meta commentary or notes. Respond directly to the last message.
`.trim();
};

const generateResponse = async (briefing, secretObjective, scenarioTitle, transcript) => {
  try {
    const prompt = buildBotPrompt(briefing, secretObjective, scenarioTitle, transcript);
    const completion = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = completion.choices[0]?.message?.content ?? '';
    return text.trim();
  } catch (err) {
    logger.error('AI bot response failed', { error: err.message });
    return null;
  }
};

module.exports = { generateResponse, BOT_USER_ID, BOT_USERNAME };
