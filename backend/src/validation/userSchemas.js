const Joi = require('joi');
const { SKILL_CATEGORIES, EXPERIENCE_LEVELS } = require('../utils/constants');

const updateProfileSchema = Joi.object({
  displayName: Joi.string().max(100),
  avatarUrl: Joi.string().uri(),
  preferredLanguage: Joi.string().max(5),
  techStacks: Joi.array().items(Joi.string()).max(10),
  skillCategories: Joi.array().items(Joi.string().valid(...SKILL_CATEGORIES)),
  experienceLevel: Joi.string().valid(...EXPERIENCE_LEVELS),
}).min(1);

const onboardingSchema = Joi.object({
  skillCategories: Joi.array().items(Joi.string().valid(...SKILL_CATEGORIES)).required(),
  techStacks: Joi.array().items(Joi.string()).max(10).required(),
  experienceLevel: Joi.string().valid(...EXPERIENCE_LEVELS).required(),
});

module.exports = {
  updateProfileSchema,
  onboardingSchema,
};
