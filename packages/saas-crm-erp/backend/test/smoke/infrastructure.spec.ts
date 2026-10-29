import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as amqp from 'amqplib';
import { createTestApp, cleanupTestApp, TestContext } from './setup';
import supertest from 'supertest';

describe('Infrastructure Smoke Tests', () => {
  let context: TestContext;
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    context = await createTestApp();
    app = context.app;
    dataSource = context.dataSource;
  });

  afterAll(async () => {
    await cleanupTestApp(context);
  });

  describe('Database Connectivity', () => {
    it('should connect to PostgreSQL database', async () => {
      expect(dataSource.isInitialized).toBe(true);

      // Test simple query
      const result = await dataSource.query('SELECT 1 as test');
      expect(result[0].test).toBe(1);
    });

    it('should have required tables', async () => {
      const tables = await dataSource.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      `);

      const tableNames = tables.map((t: any) => t.table_name);

      // Check for critical tables
      expect(tableNames).toContain('organizations');
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('customers');
    });

    it('should apply database migrations successfully', async () => {
      const migrations = await dataSource.query(`
        SELECT * FROM migrations 
        ORDER BY timestamp DESC 
        LIMIT 1
      `);

      // At least one migration should exist
      expect(migrations.length).toBeGreaterThan(0);
    });
  });

  // Redis Connectivity tests temporarily disabled - requires ioredis dependency
  // describe('Redis Connectivity', () => {
  //   let redisClient: Redis;
  //
  //   beforeAll(() => {
  //     const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  //     redisClient = new Redis(redisUrl);
  //   });
  //
  //   afterAll(async () => {
  //     await redisClient.quit();
  //   });
  //
  //   it('should connect to Redis cache', async () => {
  //     const pingResponse = await redisClient.ping();
  //     expect(pingResponse).toBe('PONG');
  //   });
  // });

  describe('RabbitMQ Connectivity', () => {
    let connection: amqp.ChannelModel;
    let channel: amqp.Channel;

    beforeAll(async () => {
      const rabbitmqUrl =
        process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
      connection = await amqp.connect(rabbitmqUrl);
      channel = await connection.createChannel();
    });

    afterAll(async () => {
      if (channel) await channel.close();
      if (connection) await connection.close();
    });

    it('should connect to RabbitMQ', async () => {
      expect(connection).toBeDefined();
      expect(channel).toBeDefined();
    });

    it('should create and delete a test queue', async () => {
      const testQueue = 'smoke-test-queue';

      await channel.assertQueue(testQueue, { durable: false });
      const queueInfo = await channel.checkQueue(testQueue);

      expect(queueInfo.queue).toBe(testQueue);

      // Cleanup
      await channel.deleteQueue(testQueue);
    });
  });

  describe('Environment Configuration', () => {
    it('should have required environment variables', () => {
      const requiredEnvVars = [
        'DATABASE_URL',
        'REDIS_URL',
        'RABBITMQ_URL',
        'JWT_SECRET',
      ];

      requiredEnvVars.forEach((envVar) => {
        expect(process.env[envVar]).toBeDefined();
      });
    });

    it('should have valid JWT secret configuration', () => {
      const jwtSecret = process.env.JWT_SECRET;
      expect(jwtSecret).toBeDefined();
      expect(jwtSecret!.length).toBeGreaterThanOrEqual(32);
    });

    it('should have valid database URL format', () => {
      const dbUrl = process.env.DATABASE_URL;
      expect(dbUrl).toMatch(/^postgresql:\/\//);
    });
  });

  describe('Application Health Endpoints', () => {
    it('GET /health should return 200', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('GET /health/db should return database status', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/db')
        .expect(200);

      expect(response.body).toHaveProperty('database', 'connected');
    });

    it('GET /health/redis should return Redis status', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/redis')
        .expect(200);

      expect(response.body).toHaveProperty('redis', 'connected');
    });
  });

  describe('External Service Dependencies', () => {
    it('should have Stripe test mode configured', () => {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      expect(stripeKey).toBeDefined();

      // Stripe test keys start with sk_test_
      if (stripeKey) {
        expect(stripeKey.startsWith('sk_test_')).toBe(true);
      }
    });

    it('should have email service configuration', () => {
      const emailFrom = process.env.EMAIL_FROM;
      const smtpHost = process.env.SMTP_HOST;

      expect(emailFrom).toBeDefined();
      expect(smtpHost).toBeDefined();
    });
  });
});

// Helper function for making requests
function request(server: any) {
  return supertest(server);
}
