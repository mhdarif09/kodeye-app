const Joi = require('joi');
const { SKILL_CATEGORIES } = require('../utils/constants');

const joinQueueSchema = Joi.object({
  mode: Joi.string().valid('duel', 'coop').required(),
  skillCategory: Joi.string().valid(...SKILL_CATEGORIES).required(),
});

module.exports = { joinQueueSchema };
