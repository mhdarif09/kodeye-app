const dotenv = require('dotenv');
const Joi = require('joi');

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  FRONTEND_URL: Joi.string().uri().required(),
  FRONTEND_URLS: Joi.string().optional(),  // comma-separated list of additional frontend URLs
  BACKEND_URL: Joi.string().uri().optional(),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(3306),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').optional(),
  DB_NAME: Joi.string().required(),

  REDIS_URL: Joi.string().required(),

  JWT_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),

  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),

  GROQ_API_KEY: Joi.string().required(),

  IPAYMU_VIRTUAL_ACCOUNT: Joi.string().required(),
  IPAYMU_API_KEY: Joi.string().required(),
  IPAYMU_MODE: Joi.string().valid('sandbox', 'production').default('sandbox'),
}).unknown();

const { value: envVars, error } = envSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  frontendUrl: envVars.FRONTEND_URL,
  frontendUrls: envVars.FRONTEND_URLS ? envVars.FRONTEND_URLS.split(',').map((u) => u.trim()) : [],
  backendUrl: envVars.BACKEND_URL || `http://localhost:${envVars.PORT}`,
  mysql: {
    host: envVars.DB_HOST,
    port: envVars.DB_PORT,
    user: envVars.DB_USER,
    password: envVars.DB_PASSWORD,
    database: envVars.DB_NAME,
  },
  redis: {
    url: envVars.REDIS_URL,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    refreshSecret: envVars.JWT_REFRESH_SECRET,
  },
  google: {
    clientId: envVars.GOOGLE_CLIENT_ID,
    clientSecret: envVars.GOOGLE_CLIENT_SECRET,
  },
  groq: {
    apiKey: envVars.GROQ_API_KEY,
  },
  ipaymu: {
    virtualAccount: envVars.IPAYMU_VIRTUAL_ACCOUNT,
    apiKey: envVars.IPAYMU_API_KEY,
    mode: envVars.IPAYMU_MODE,
    baseUrl: envVars.IPAYMU_MODE === 'production' ? 'https://my.ipaymu.com' : 'https://sandbox.ipaymu.com',
  },
};
