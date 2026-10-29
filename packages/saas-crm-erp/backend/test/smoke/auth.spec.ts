import {
  createTestApp,
  cleanupTestApp,
  TestContext,
  setupTestData,
  authenticateTestUser,
  getAuthHeaders,
} from './setup';
import * as jwt from 'jsonwebtoken';
import supertest from 'supertest';

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    role: string;
    organization_id: string;
  };
}

interface ErrorResponse {
  message: string;
  statusCode: number;
}

describe('Authentication Smoke Tests', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await createTestApp();
    await setupTestData(context);
  });

  afterAll(async () => {
    await cleanupTestApp(context);
  });

  describe('Login Endpoint', () => {
    it('should authenticate with valid credentials', async () => {
      const { app, testUser } = context;

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser!.email,
          password: testUser!.password,
        })
        .expect(200);

      const body = response.body as LoginResponse;
      expect(body).toHaveProperty('access_token');
      expect(body).toHaveProperty('refresh_token');
      expect(body).toHaveProperty('user');
      expect(body.user).toHaveProperty('id');
      expect(body.user).toHaveProperty('email', testUser!.email);
      expect(body.user).toHaveProperty('role');
      expect(body.user).toHaveProperty('organization_id');
    });

    it('should reject invalid credentials', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      const error = response.body as ErrorResponse;
      expect(error.message).toBe('Invalid credentials');
      expect(error.statusCode).toBe(401);
    });

    it('should reject empty request body', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);

      const error = response.body as ErrorResponse;
      expect(error.message).toContain('email');
      expect(error.message).toContain('password');
    });

    it('should validate email format', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);

      const error = response.body as ErrorResponse;
      expect(error.message).toContain('email');
    });
  });

  describe('Token Refresh Endpoint', () => {
    let refreshToken: string;

    beforeAll(async () => {
      // First login to get tokens
      const { app, testUser } = context;

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser!.email,
          password: testUser!.password,
        })
        .expect(200);

      refreshToken = loginResponse.body.refresh_token;
    });

    it('should refresh access token with valid refresh token', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.access_token).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: 'invalid.token.here' })
        .expect(401);

      const error = response.body as ErrorResponse;
      expect(error.message).toBe('Invalid refresh token');
      expect(error.statusCode).toBe(401);
    });

    it('should reject empty refresh token', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({})
        .expect(401);

      const error = response.body as ErrorResponse;
      expect(error.message).toBe('Invalid refresh token');
    });
  });

  describe('Protected Endpoints', () => {
    let authToken: string;

    beforeAll(async () => {
      authToken = await authenticateTestUser(context);
    });

    it('should access protected endpoint with valid token', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .get('/organizations')
        .set(getAuthHeaders(authToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject access without token', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .get('/organizations')
        .expect(401);

      const error = response.body as ErrorResponse;
      expect(error.message).toBe('Unauthorized');
      expect(error.statusCode).toBe(401);
    });

    it('should reject access with invalid token', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .get('/organizations')
        .set(getAuthHeaders('invalid.token.here'))
        .expect(401);

      const error = response.body as ErrorResponse;
      expect(error.message).toContain('Unauthorized');
    });

    it('should reject access with expired token', async () => {
      const { app } = context;

      // Create an expired token (1 second expiry, wait 2 seconds)
      const expiredToken = jwt.sign(
        { sub: 'test', email: 'test@example.com', role: 'admin' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1s' },
      );

      // Wait for token to expire
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const response = await request(app.getHttpServer())
        .get('/organizations')
        .set(getAuthHeaders(expiredToken))
        .expect(401);

      const error = response.body as ErrorResponse;
      expect(error.message).toContain('Unauthorized');
    });
  });

  describe('Role-Based Access Control', () => {
    it('should have user role in token payload', async () => {
      const { app, testUser } = context;

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser!.email,
          password: testUser!.password,
        })
        .expect(200);

      const payload = jwt.decode(loginResponse.body.access_token);

      expect(payload).toHaveProperty('role');
      expect(payload).toHaveProperty('org_id');
      expect(payload).toHaveProperty('sub');
      expect(payload).toHaveProperty('email', testUser!.email);
    });

    it('should include organization ID in token', async () => {
      const { app, testUser } = context;

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser!.email,
          password: testUser!.password,
        })
        .expect(200);

      const payload = jwt.decode(loginResponse.body.access_token);

      expect(payload).toHaveProperty('org_id', testUser!.organizationId);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer()).get('/').expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers['x-content-type-options']).toBe('nosniff');

      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers['x-frame-options']).toBe('DENY');

      expect(response.headers).toHaveProperty('x-xss-protection');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });

    it('should not expose sensitive headers', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer()).get('/').expect(200);

      expect(response.headers).not.toHaveProperty('x-powered-by');
      expect(response.headers).not.toHaveProperty('server');
    });
  });
});

// Helper function for making requests
function request(server: any): ReturnType<typeof supertest> {
  return supertest(server);
}
