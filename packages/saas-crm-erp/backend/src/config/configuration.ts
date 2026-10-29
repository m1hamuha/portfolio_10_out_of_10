export default () => ({
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'crm_erp',
    poolSize: parseInt(process.env.DB_POOL_SIZE || '10', 10) || 10,
    maxConnections:
      parseInt(process.env.DB_MAX_CONNECTIONS || '100', 10) || 100,
    connectionTimeout:
      parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10) || 10000,
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10) || 30000,
    ssl: process.env.DB_SSL === 'true',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
  },
  rabbitmq: {
    host: process.env.RABBITMQ_HOST || 'localhost',
    port: parseInt(process.env.RABBITMQ_PORT || '5672', 10) || 5672,
    username: process.env.RABBITMQ_USERNAME || 'guest',
    password: process.env.RABBITMQ_PASSWORD || 'guest',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '900', 10),
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  app: {
    port: parseInt(process.env.PORT || '3001', 10) || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    enableTenantHeaderBypass:
      process.env.ENABLE_TENANT_HEADER_BYPASS === 'true',
  },
});
