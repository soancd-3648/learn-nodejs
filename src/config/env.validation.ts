import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_HOST: Joi.string().default('localhost'),
  DATABASE_PORT: Joi.number().port().default(5432),
  DATABASE_NAME: Joi.string().default('eventhub'),
  DATABASE_USER: Joi.string().default('eventhub'),
  DATABASE_PASSWORD: Joi.string().default('eventhub'),
  JWT_ACCESS_SECRET: Joi.string().min(32).default('test-access-secret-that-is-long-enough'),
  JWT_REFRESH_SECRET: Joi.string().min(32).default('test-refresh-secret-that-is-long-enough'),
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  JWT_REFRESH_TTL: Joi.string().default('7d'),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  MAIL_HOST: Joi.string().default('localhost'),
  MAIL_PORT: Joi.number().port().default(1025),
  MAIL_FROM: Joi.string().default('no-reply@eventhub.local'),
});
