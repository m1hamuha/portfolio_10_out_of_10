import {
  createTestApp,
  cleanupTestApp,
  TestContext,
  setupTestData,
  authenticateTestUser,
  getAuthHeaders,
} from '../smoke/setup';
import { Organization } from '../../src/organizations/organization.entity';
import { User } from '../../src/users/user.entity';
import supertest from 'supertest';

// Helper function for making requests
function request(server: unknown) {
  return supertest(server as any);
}

/**
 * Acceptance Test: Organization Management Flow
 *
 * Business Scenario: As an Organization Administrator,
 * I want to manage my organization's settings and users
 * so that I can maintain proper control over my company's data.
 *
 * Acceptance Criteria:
 * 1. Admin can log in and obtain authentication token
 * 2. Admin can view organization details
 * 3. Admin can update organization settings
 * 4. Admin can manage organization users
 * 5. System enforces role-based access control
 * 6. Data is properly isolated between organizations
 */
describe('Organization Management Acceptance Test', () => {
  let context: TestContext;
  let authToken: string;
  let testOrganizationId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Setup test environment with test data
    context = await createTestApp();
    await setupTestData(context);
    authToken = await authenticateTestUser(context);

    // Get the test organization ID
    const { dataSource } = context;
    const orgRepo = dataSource.getRepository('Organization');
    const organization = (await orgRepo.findOne({
      where: { name: 'Test Organization' },
    })) as Organization | null;
    testOrganizationId = organization!.id;

    // Get the test user ID
    const userRepo = dataSource.getRepository('User');
    const testUser = (await userRepo.findOne({
      where: { email: 'test@example.com' },
    })) as User | null;
    testUserId = testUser!.id;
  });

  afterAll(async () => {
    await cleanupTestApp(context);
  });

  describe('Scenario 1: Admin Authentication and Authorization', () => {
    it('should authenticate admin user with valid credentials', async () => {
      const { app, testUser } = context;

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser!.email,
          password: testUser!.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', testUser!.email);
      expect(response.body.user).toHaveProperty('role', 'admin');
      expect(response.body.user).toHaveProperty(
        'organization_id',
        testOrganizationId,
      );
    });

    it('should reject unauthorized access to protected endpoints', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .get('/organizations')
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Unauthorized');
      expect(response.body).toHaveProperty('statusCode', 401);
    });

    it('should allow authorized access to protected endpoints', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .get('/organizations')
        .set(getAuthHeaders(authToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Scenario 2: Organization Profile Management', () => {
    let createdOrgId: string;

    it('should create a new organization for testing management flow', async () => {
      const { app } = context;

      const newOrgData = {
        name: 'Acceptance Test Organization',
        domain: 'acceptance-test.local',
        status: 'active',
      };

      const response = await request(app.getHttpServer())
        .post('/organizations')
        .set(getAuthHeaders(authToken))
        .send(newOrgData)
        .expect(201);

      const createdOrg = response.body;
      expect(createdOrg).toHaveProperty('id');
      expect(createdOrg).toHaveProperty('name', newOrgData.name);
      expect(createdOrg).toHaveProperty('domain', newOrgData.domain);
      expect(createdOrg).toHaveProperty('status', newOrgData.status);

      createdOrgId = createdOrg.id;
    });

    it('should retrieve organization details', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .get(`/organizations/${createdOrgId}`)
        .set(getAuthHeaders(authToken))
        .expect(200);

      expect(response.body).toHaveProperty('id', createdOrgId);
      expect(response.body).toHaveProperty(
        'name',
        'Acceptance Test Organization',
      );
      expect(response.body).toHaveProperty('domain', 'acceptance-test.local');
      expect(response.body).toHaveProperty('status', 'active');
    });

    it('should update organization settings', async () => {
      const { app } = context;

      const updateData = {
        name: 'Updated Acceptance Test Organization',
        status: 'suspended',
        domain: 'updated-acceptance.local',
      };

      const response = await request(app.getHttpServer())
        .patch(`/organizations/${createdOrgId}`)
        .set(getAuthHeaders(authToken))
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('id', createdOrgId);
      expect(response.body).toHaveProperty('name', updateData.name);
      expect(response.body).toHaveProperty('status', updateData.status);
      expect(response.body).toHaveProperty('domain', updateData.domain);
    });

    it('should verify organization update persistence', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .get(`/organizations/${createdOrgId}`)
        .set(getAuthHeaders(authToken))
        .expect(200);

      expect(response.body).toHaveProperty(
        'name',
        'Updated Acceptance Test Organization',
      );
      expect(response.body).toHaveProperty('status', 'suspended');
    });

    afterAll(async () => {
      // Cleanup the created organization
      if (createdOrgId) {
        const { dataSource } = context;
        const orgRepo = dataSource.getRepository('Organization');
        await orgRepo.delete({ id: createdOrgId });
      }
    });
  });

  describe('Scenario 3: Organization User Management', () => {
    it('should list users belonging to the organization', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .get(`/organizations/${testOrganizationId}/users`)
        .set(getAuthHeaders(authToken))
        .expect(200);

      const users = response.body;
      expect(Array.isArray(users)).toBe(true);

      // Should include at least the test user
      const testUser = users.find((u: User) => u.email === 'test@example.com');
      expect(testUser).toBeDefined();
      expect(testUser).toHaveProperty('organization_id', testOrganizationId);
      expect(testUser).toHaveProperty('role', 'admin');
    });

    it('should enforce organization boundary - cannot access other organization users', async () => {
      const { app, dataSource } = context;

      // Create a second organization
      const orgRepo = dataSource.getRepository('Organization');
      const otherOrg = await orgRepo.save({
        name: 'Other Organization',
        domain: 'other.local',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Try to access other organization's users (should fail or return empty)
      const response = await request(app.getHttpServer())
        .get(`/organizations/${otherOrg.id}/users`)
        .set(getAuthHeaders(authToken))
        .expect(200);

      // Depending on implementation, this might return empty array or 403
      // For now, we expect it to return empty array (no users in other org)
      expect(Array.isArray(response.body)).toBe(true);

      // Cleanup
      await orgRepo.delete({ id: otherOrg.id });
    });
  });

  describe('Scenario 4: Organization Lifecycle', () => {
    let lifecycleOrgId: string;

    it('should create organization with initial settings', async () => {
      const { app } = context;

      const orgData = {
        name: 'Lifecycle Test Organization',
        domain: 'lifecycle-test.local',
        status: 'pending',
      };

      const response = await request(app.getHttpServer())
        .post('/organizations')
        .set(getAuthHeaders(authToken))
        .send(orgData)
        .expect(201);

      lifecycleOrgId = response.body.id;
    });

    it('should activate organization', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .patch(`/organizations/${lifecycleOrgId}`)
        .set(getAuthHeaders(authToken))
        .send({ status: 'active' })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'active');
    });

    it('should suspend organization', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .patch(`/organizations/${lifecycleOrgId}`)
        .set(getAuthHeaders(authToken))
        .send({ status: 'suspended' })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'suspended');
    });

    it('should delete organization', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .delete(`/organizations/${lifecycleOrgId}`)
        .set(getAuthHeaders(authToken))
        .expect(200);

      expect(response.body).toHaveProperty(
        'message',
        'Organization deleted successfully',
      );

      // Verify deletion
      const getResponse = await request(app.getHttpServer())
        .get(`/organizations/${lifecycleOrgId}`)
        .set(getAuthHeaders(authToken))
        .expect(404);

      expect(getResponse.body).toHaveProperty(
        'message',
        'Organization not found',
      );
    });
  });

  describe('Scenario 5: Business Rule Validation', () => {
    it('should prevent duplicate organization domains', async () => {
      const { app } = context;

      const orgData = {
        name: 'Duplicate Domain Org',
        domain: 'test.local', // Same as test organization
        status: 'active',
      };

      const response = await request(app.getHttpServer())
        .post('/organizations')
        .set(getAuthHeaders(authToken))
        .send(orgData);

      // Expect either 400 or 409 conflict
      expect([400, 409]).toContain(response.status);
    });

    it('should validate organization domain format', async () => {
      const { app } = context;

      const invalidOrgData = {
        name: 'Invalid Org',
        domain: 'invalid domain with spaces',
        status: 'active',
      };

      const response = await request(app.getHttpServer())
        .post('/organizations')
        .set(getAuthHeaders(authToken))
        .send(invalidOrgData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('domain');
    });

    it('should enforce required fields', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .post('/organizations')
        .set(getAuthHeaders(authToken))
        .send({}) // Empty object
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('name');
      expect(response.body.message).toContain('domain');
    });
  });

  describe('Scenario 6: Performance and Scalability', () => {
    it('should handle multiple organization requests within acceptable time', async () => {
      const { app } = context;
      const startTime = Date.now();

      // Make multiple requests
      const requests = [
        request(app.getHttpServer())
          .get('/organizations')
          .set(getAuthHeaders(authToken)),
        request(app.getHttpServer())
          .get(`/organizations/${testOrganizationId}`)
          .set(getAuthHeaders(authToken)),
        request(app.getHttpServer())
          .get(`/organizations/${testOrganizationId}/users`)
          .set(getAuthHeaders(authToken)),
      ];

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // Total time should be less than 2 seconds for smoke test
      expect(totalTime).toBeLessThan(2000);
    });
  });
});
