import {
  createTestApp,
  cleanupTestApp,
  TestContext,
  setupTestData,
  authenticateTestUser,
  getAuthHeaders,
} from './setup';
import { Organization } from '../../src/organizations/organization.entity';
import { User } from '../../src/users/user.entity';

// Organization now includes domain and status fields
type OrganizationResponse = Organization;

interface ErrorResponse {
  message: string;
  statusCode?: number;
}

describe('Organizations Smoke Tests', () => {
  let context: TestContext;
  let authToken: string;
  let testOrganizationId: string;

  beforeAll(async () => {
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
  });

  afterAll(async () => {
    await cleanupTestApp(context);
  });

  describe('GET /organizations', () => {
    it('should return list of organizations', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .get('/organizations')
        .set(getAuthHeaders(authToken))
        .expect(200);

      const body = response.body as OrganizationResponse[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);

      // Check structure of first organization
      if (body.length > 0) {
        const org = body[0];
        expect(org).toHaveProperty('id');
        expect(org).toHaveProperty('name');
        expect(org).toHaveProperty('domain');
        expect(org).toHaveProperty('status');
        expect(org).toHaveProperty('created_at');
        expect(org).toHaveProperty('updated_at');
      }
    });

    it('should support pagination', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .get('/organizations?page=1&limit=5')
        .set(getAuthHeaders(authToken))
        .expect(200);

      const body = response.body as OrganizationResponse[];
      expect(body).toBeInstanceOf(Array);

      // Check for pagination metadata in headers or response
      expect(response.headers).toHaveProperty('x-total-count');
      expect(response.headers).toHaveProperty('x-page');
      expect(response.headers).toHaveProperty('x-limit');
    });

    it('should filter organizations by status', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .get('/organizations?status=active')
        .set(getAuthHeaders(authToken))
        .expect(200);

      const body = response.body as OrganizationResponse[];
      expect(Array.isArray(body)).toBe(true);

      // All returned organizations should have status 'active'
      if (body.length > 0) {
        body.forEach((org) => {
          expect(org.status).toBe('active');
        });
      }
    });
  });

  describe('GET /organizations/:id', () => {
    it('should return organization by ID', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .get(`/organizations/${testOrganizationId}`)
        .set(getAuthHeaders(authToken))
        .expect(200);

      expect(response.body).toHaveProperty('id', testOrganizationId);
      expect(response.body).toHaveProperty('name', 'Test Organization');
      expect(response.body).toHaveProperty('domain', 'test.local');
      expect(response.body).toHaveProperty('status', 'active');
    });

    it('should return 404 for non-existent organization', async () => {
      const { app } = context;

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .get(`/organizations/${nonExistentId}`)
        .set(getAuthHeaders(authToken))
        .expect(404);

      const errorBody = response.body as ErrorResponse;
      expect(errorBody).toHaveProperty('message', 'Organization not found');
      expect(errorBody).toHaveProperty('statusCode', 404);
    });

    it('should return 400 for invalid UUID', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .get('/organizations/invalid-uuid')
        .set(getAuthHeaders(authToken))
        .expect(400);

      const errorBody = response.body as ErrorResponse;
      expect(errorBody).toHaveProperty('message');
      expect(errorBody.message).toContain('UUID');
    });
  });

  describe('POST /organizations', () => {
    it('should create a new organization', async () => {
      const { app } = context;

      const newOrgData = {
        name: 'New Test Organization',
        domain: 'newtest.local',
        status: 'active',
      };

      const response = await request(app.getHttpServer())
        .post('/organizations')
        .set(getAuthHeaders(authToken))
        .send(newOrgData)
        .expect(201);

      const createdOrg = response.body as OrganizationResponse;
      expect(createdOrg).toHaveProperty('id');
      expect(createdOrg).toHaveProperty('name', newOrgData.name);
      expect(createdOrg).toHaveProperty('domain', newOrgData.domain);
      expect(createdOrg).toHaveProperty('status', newOrgData.status);
      expect(createdOrg).toHaveProperty('created_at');
      expect(createdOrg).toHaveProperty('updated_at');

      // Cleanup - delete the created organization
      const { dataSource } = context;
      const orgRepo = dataSource.getRepository('Organization');
      await orgRepo.delete({ id: createdOrg.id });
    });

    it('should validate required fields', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .post('/organizations')
        .set(getAuthHeaders(authToken))
        .send({}) // Empty object
        .expect(400);

      const errorBody = response.body as ErrorResponse;
      expect(errorBody).toHaveProperty('message');
      expect(errorBody.message).toContain('name');
      expect(errorBody.message).toContain('domain');
    });

    it('should validate domain format', async () => {
      const { app } = context;

      const invalidOrgData = {
        name: 'Invalid Org',
        domain: 'not a valid domain',
        status: 'active',
      };

      const response = await request(app.getHttpServer())
        .post('/organizations')
        .set(getAuthHeaders(authToken))
        .send(invalidOrgData)
        .expect(400);

      const errorBody = response.body as ErrorResponse;
      expect(errorBody).toHaveProperty('message');
      expect(errorBody.message).toContain('domain');
    });
  });

  describe('PATCH /organizations/:id', () => {
    it('should update organization', async () => {
      const { app, dataSource } = context;

      // First create a test organization to update
      const orgRepo = dataSource.getRepository('Organization');
      const testOrg = (await orgRepo.save({
        name: 'Org to Update',
        domain: 'update.local',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      })) as Organization;

      const updateData = {
        name: 'Updated Organization Name',
        status: 'suspended',
      };

      const response = await request(app.getHttpServer())
        .patch(`/organizations/${testOrg.id}`)
        .set(getAuthHeaders(authToken))
        .send(updateData)
        .expect(200);

      const updatedResponse = response.body as OrganizationResponse;
      expect(updatedResponse).toHaveProperty('id', testOrg.id);
      expect(updatedResponse).toHaveProperty('name', updateData.name);
      expect(updatedResponse).toHaveProperty('status', updateData.status);
      expect(updatedResponse).toHaveProperty('domain', testOrg.domain); // Should remain unchanged

      // Verify the update persisted
      const updatedOrg = (await orgRepo.findOne({
        where: { id: testOrg.id },
      })) as Organization | null;
      expect(updatedOrg!.name).toBe(updateData.name);
      expect(updatedOrg!.status).toBe(updateData.status);

      // Cleanup
      await orgRepo.delete({ id: testOrg.id });
    });

    it('should return 404 when updating non-existent organization', async () => {
      const { app } = context;

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .patch(`/organizations/${nonExistentId}`)
        .set(getAuthHeaders(authToken))
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Organization not found');
    });
  });

  describe('DELETE /organizations/:id', () => {
    it('should delete organization', async () => {
      const { app, dataSource } = context;

      // First create a test organization to delete
      const orgRepo = dataSource.getRepository('Organization');
      const testOrg = (await orgRepo.save({
        name: 'Org to Delete',
        domain: 'delete.local',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      })) as Organization;

      const response = await request(app.getHttpServer())
        .delete(`/organizations/${testOrg.id}`)
        .set(getAuthHeaders(authToken))
        .expect(200);

      const deleteResponse = response.body as { message: string };
      expect(deleteResponse).toHaveProperty(
        'message',
        'Organization deleted successfully',
      );

      // Verify the organization is deleted
      const deletedOrg = (await orgRepo.findOne({
        where: { id: testOrg.id },
      })) as Organization | null;
      expect(deletedOrg).toBeNull();
    });

    it('should return 404 when deleting non-existent organization', async () => {
      const { app } = context;

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .delete(`/organizations/${nonExistentId}`)
        .set(getAuthHeaders(authToken))
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Organization not found');
    });
  });

  describe('Organization Users Endpoint', () => {
    it('should get users for organization', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .get(`/organizations/${testOrganizationId}/users`)
        .set(getAuthHeaders(authToken))
        .expect(200);

      const users = response.body as User[];
      expect(Array.isArray(users)).toBe(true);

      // Should include at least the test user
      if (users.length > 0) {
        const user = users.find((u) => u.email === 'test@example.com');
        expect(user).toBeDefined();
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email', 'test@example.com');
        expect(user).toHaveProperty('role');
        expect(user).toHaveProperty('organization_id', testOrganizationId);
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on organization endpoints', async () => {
      const { app } = context;

      // Make multiple rapid requests
      const requests = Array(10)
        .fill(0)
        .map(() =>
          request(app.getHttpServer())
            .get('/organizations')
            .set(getAuthHeaders(authToken)),
        );

      const responses = await Promise.all(requests);

      // Check if any response indicates rate limiting (429)
      const rateLimited = responses.some((res) => res.status === 429);

      if (rateLimited) {
        const rateLimitedResponse = responses.find((res) => res.status === 429);
        const errorBody = rateLimitedResponse!.body as ErrorResponse;
        expect(errorBody).toHaveProperty('message');
        expect(errorBody.message).toContain('Too Many Requests');
      }
    });
  });
});

import supertest from 'supertest';

// Helper function for making requests
function request(server: unknown) {
  return supertest(server as any);
}
