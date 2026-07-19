const Joi = require('joi');

const joinQueueSchema = Joi.object({
  mode: Joi.string().valid('duel', 'coop').required(),
  category: Joi.string().required(),
  difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
});

module.exports = { joinQueueSchema };
