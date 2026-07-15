const Redis = require('ioredis');
const config = require('../config/env');
const logger = require('../utils/logger');

const redis = new Redis(config.redis.url, {
  lazyConnect: true,
});

redis.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

module.exports = redis;
