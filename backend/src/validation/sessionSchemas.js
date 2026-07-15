const Joi = require('joi');

const peerRatingSchema = Joi.object({
  toUserId: Joi.string().uuid().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  positiveFeedback: Joi.string().max(1000).allow('', null),
  improvementFeedback: Joi.string().max(1000).allow('', null),
});

module.exports = { peerRatingSchema };
