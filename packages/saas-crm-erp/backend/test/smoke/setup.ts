import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';

export interface TestContext {
  app: INestApplication;
  dataSource: DataSource;
  configService: ConfigService;
  authToken?: string;
  testUser?: {
    email: string;
    password: string;
    id?: string;
    organizationId?: string;
  };
}

export async function createTestApp(): Promise<TestContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  const dataSource = moduleFixture.get<DataSource>(DataSource);
  const configService = moduleFixture.get<ConfigService>(ConfigService);

  return {
    app,
    dataSource,
    configService,
  };
}

export async function cleanupTestApp(context: TestContext): Promise<void> {
  if (context.app) {
    await context.app.close();
  }
}

export async function setupTestData(context: TestContext): Promise<void> {
  const { dataSource } = context;

  // Create test organization if it doesn't exist
  const orgRepo = dataSource.getRepository('Organization');
  let organization = await orgRepo.findOne({
    where: { name: 'Test Organization' },
  });

  if (!organization) {
    organization = await orgRepo.save({
      name: 'Test Organization',
      domain: 'test.local',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  // Create test user if it doesn't exist
  const userRepo = dataSource.getRepository('User');
  let testUser = await userRepo.findOne({
    where: { email: 'test@example.com' },
  });

  if (!testUser) {
    const passwordHash = await bcrypt.hash('TestPassword123!', 10);

    testUser = await userRepo.save({
      email: 'test@example.com',
      password_hash: passwordHash,
      first_name: 'Test',
      last_name: 'User',
      role: 'admin',
      organization_id: organization.id,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  context.testUser = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    id: testUser.id,
    organizationId: organization.id,
  };
}

export async function authenticateTestUser(
  context: TestContext,
): Promise<string> {
  const { app, testUser } = context;

  if (!testUser) {
    throw new Error('Test user not set up');
  }

  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({
      email: testUser.email,
      password: testUser.password,
    })
    .expect(200);

  const { access_token } = response.body;
  context.authToken = access_token;

  return access_token;
}

export function getAuthHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export function getTestConfig(): {
  databaseUrl: string;
  redisUrl: string;
  rabbitmqUrl: string;
  stripeTestKey: string;
} {
  return {
    databaseUrl:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/crm_erp_test',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    rabbitmqUrl:
      process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    stripeTestKey: process.env.STRIPE_TEST_KEY || 'sk_test_xxx',
  };
}
