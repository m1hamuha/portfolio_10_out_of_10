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
 * Acceptance Test: Customer Management Flow
 *
 * Business Scenario: As a Sales Representative,
 * I want to manage customer records throughout their lifecycle
 * so that I can track interactions, sales opportunities, and provide better service.
 *
 * Acceptance Criteria:
 * 1. Authenticated user can view customer list
 * 2. User can create new customer records with required information
 * 3. User can update customer details and status
 * 4. User can search and filter customers
 * 5. System enforces organization isolation (tenant security)
 * 6. Customer data validation and business rules are enforced
 * 7. Customer lifecycle transitions are properly managed
 * 8. Performance remains acceptable with growing customer data
 */
describe('Customer Management Acceptance Test', () => {
  let context: TestContext;
  let authToken: string;
  let testOrganizationId: string;
  let testUserId: string;
  let testCustomerId: string;

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

    // Create a test customer for reference
    const customerRepo = dataSource.getRepository('Customer');
    const testCustomer = await customerRepo.save({
      organization_id: testOrganizationId,
      name: 'Existing Test Customer',
      email: 'existing.customer@example.com',
      phone: '+1234567890',
      status: 'lead',
      created_at: new Date(),
      updated_at: new Date(),
    });
    testCustomerId = testCustomer.id;
  });

  afterAll(async () => {
    await cleanupTestApp(context);
  });

  describe('Scenario 1: Customer Discovery and Listing', () => {
    it('should authenticate and retrieve customer list', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .get('/customers')
        .set(getAuthHeaders(authToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Verify customer structure
      const customer = response.body[0];
      expect(customer).toHaveProperty('id');
      expect(customer).toHaveProperty('name');
      expect(customer).toHaveProperty('organization_id');
      expect(customer).toHaveProperty('status');
    });

    it('should filter customers by status', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .get('/customers?status=lead')
        .set(getAuthHeaders(authToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      // All returned customers should have status 'lead'
      if (response.body.length > 0) {
        response.body.forEach((customer: any) => {
          expect(customer.status).toBe('lead');
        });
      }
    });

    it('should search customers by name or email', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .get('/customers?search=Existing')
        .set(getAuthHeaders(authToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      // Should find our test customer
      const foundCustomer = response.body.find(
        (c: any) => c.id === testCustomerId,
      );
      expect(foundCustomer).toBeDefined();
      expect(foundCustomer.name).toContain('Existing');
    });
  });

  describe('Scenario 2: Customer Creation and Validation', () => {
    let createdCustomerId: string;

    it('should create a new customer with valid data', async () => {
      const { app } = context;

      const newCustomerData = {
        name: 'New Acceptance Test Customer',
        email: 'acceptance.test@example.com',
        phone: '+15551234567',
        status: 'lead',
        organization_id: testOrganizationId,
      };

      const response = await request(app.getHttpServer())
        .post('/customers')
        .set(getAuthHeaders(authToken))
        .send(newCustomerData)
        .expect(201);

      const createdCustomer = response.body;
      expect(createdCustomer).toHaveProperty('id');
      expect(createdCustomer).toHaveProperty('name', newCustomerData.name);
      expect(createdCustomer).toHaveProperty('email', newCustomerData.email);
      expect(createdCustomer).toHaveProperty('phone', newCustomerData.phone);
      expect(createdCustomer).toHaveProperty('status', newCustomerData.status);
      expect(createdCustomer).toHaveProperty(
        'organization_id',
        testOrganizationId,
      );

      createdCustomerId = createdCustomer.id;
    });

    it('should validate required fields on customer creation', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .post('/customers')
        .set(getAuthHeaders(authToken))
        .send({
          // Missing required name and email
          status: 'lead',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('name');
      expect(response.body.message).toContain('email');
    });

    it('should prevent duplicate customer emails within organization', async () => {
      const { app } = context;

      const duplicateCustomerData = {
        name: 'Duplicate Customer',
        email: 'acceptance.test@example.com', // Same as previously created
        organization_id: testOrganizationId,
      };

      const response = await request(app.getHttpServer())
        .post('/customers')
        .set(getAuthHeaders(authToken))
        .send(duplicateCustomerData)
        .expect(409); // Conflict

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('already exists');
    });

    afterAll(async () => {
      // Cleanup the created customer
      if (createdCustomerId) {
        const { dataSource } = context;
        const customerRepo = dataSource.getRepository('Customer');
        await customerRepo.delete({ id: createdCustomerId });
      }
    });
  });

  describe('Scenario 3: Customer Profile Management', () => {
    let managedCustomerId: string;

    beforeAll(async () => {
      // Create a customer to manage in this scenario
      const { dataSource } = context;
      const customerRepo = dataSource.getRepository('Customer');
      const managedCustomer = await customerRepo.save({
        organization_id: testOrganizationId,
        name: 'Managed Customer',
        email: 'managed@example.com',
        phone: '+15559876543',
        status: 'lead',
        created_at: new Date(),
        updated_at: new Date(),
      });
      managedCustomerId = managedCustomer.id;
    });

    it('should retrieve customer details by ID', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .get(`/customers/${managedCustomerId}`)
        .set(getAuthHeaders(authToken))
        .expect(200);

      expect(response.body).toHaveProperty('id', managedCustomerId);
      expect(response.body).toHaveProperty('name', 'Managed Customer');
      expect(response.body).toHaveProperty('email', 'managed@example.com');
      expect(response.body).toHaveProperty('status', 'lead');
    });

    it('should update customer information', async () => {
      const { app } = context;

      const updateData = {
        name: 'Updated Managed Customer',
        phone: '+15551112222',
        status: 'active',
      };

      const response = await request(app.getHttpServer())
        .patch(`/customers/${managedCustomerId}`)
        .set(getAuthHeaders(authToken))
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('id', managedCustomerId);
      expect(response.body).toHaveProperty('name', updateData.name);
      expect(response.body).toHaveProperty('phone', updateData.phone);
      expect(response.body).toHaveProperty('status', updateData.status);
    });

    it('should verify customer update persistence', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .get(`/customers/${managedCustomerId}`)
        .set(getAuthHeaders(authToken))
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Updated Managed Customer');
      expect(response.body).toHaveProperty('status', 'active');
    });

    afterAll(async () => {
      // Cleanup the managed customer
      if (managedCustomerId) {
        const { dataSource } = context;
        const customerRepo = dataSource.getRepository('Customer');
        await customerRepo.delete({ id: managedCustomerId });
      }
    });
  });

  describe('Scenario 4: Organization Isolation and Security', () => {
    it('should enforce tenant isolation - cannot access other organization customers', async () => {
      const { app, dataSource } = context;

      // Create another organization and customer
      const orgRepo = dataSource.getRepository('Organization');
      const otherOrg = await orgRepo.save({
        name: 'Other Organization for Isolation Test',
        domain: 'isolation-test.local',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const customerRepo = dataSource.getRepository('Customer');
      const otherCustomer = await customerRepo.save({
        organization_id: otherOrg.id,
        name: 'Other Organization Customer',
        email: 'other.org.customer@example.com',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Try to access other organization's customer (should fail due to tenant isolation)
      const response = await request(app.getHttpServer())
        .get(`/customers/${otherCustomer.id}`)
        .set(getAuthHeaders(authToken))
        .expect(404); // Not found due to tenant isolation

      expect(response.body).toHaveProperty('message', 'Customer not found');

      // Cleanup
      await customerRepo.delete({ id: otherCustomer.id });
      await orgRepo.delete({ id: otherOrg.id });
    });

    it('should only list customers belonging to authenticated user organization', async () => {
      const { app, dataSource } = context;

      // Create another organization with customers
      const orgRepo = dataSource.getRepository('Organization');
      const otherOrg = await orgRepo.save({
        name: 'Second Organization',
        domain: 'second.local',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const customerRepo = dataSource.getRepository('Customer');
      await customerRepo.save({
        organization_id: otherOrg.id,
        name: 'Second Org Customer',
        email: 'second@example.com',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Get all customers - should only return customers from test organization
      const response = await request(app.getHttpServer())
        .get('/customers')
        .set(getAuthHeaders(authToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      // All returned customers should belong to test organization
      response.body.forEach((customer: any) => {
        expect(customer.organization_id).toBe(testOrganizationId);
      });

      // Cleanup
      await customerRepo.delete({ organization_id: otherOrg.id });
      await orgRepo.delete({ id: otherOrg.id });
    });
  });

  describe('Scenario 5: Customer Lifecycle Management', () => {
    let lifecycleCustomerId: string;

    it('should create customer in initial lead status', async () => {
      const { app } = context;

      const customerData = {
        name: 'Lifecycle Customer',
        email: 'lifecycle@example.com',
        organization_id: testOrganizationId,
        status: 'lead',
      };

      const response = await request(app.getHttpServer())
        .post('/customers')
        .set(getAuthHeaders(authToken))
        .send(customerData)
        .expect(201);

      lifecycleCustomerId = response.body.id;
      expect(response.body).toHaveProperty('status', 'lead');
    });

    it('should transition customer from lead to prospect', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .patch(`/customers/${lifecycleCustomerId}`)
        .set(getAuthHeaders(authToken))
        .send({ status: 'prospect' })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'prospect');
    });

    it('should transition customer from prospect to active', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .patch(`/customers/${lifecycleCustomerId}`)
        .set(getAuthHeaders(authToken))
        .send({ status: 'active' })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'active');
    });

    it('should archive inactive customer', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .patch(`/customers/${lifecycleCustomerId}`)
        .set(getAuthHeaders(authToken))
        .send({ status: 'archived' })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'archived');
    });

    afterAll(async () => {
      // Cleanup the lifecycle customer
      if (lifecycleCustomerId) {
        const { dataSource } = context;
        const customerRepo = dataSource.getRepository('Customer');
        await customerRepo.delete({ id: lifecycleCustomerId });
      }
    });
  });

  describe('Scenario 6: Business Rule Validation', () => {
    it('should validate customer email format', async () => {
      const { app } = context;

      const invalidCustomerData = {
        name: 'Invalid Email Customer',
        email: 'invalid-email-format',
        organization_id: testOrganizationId,
      };

      const response = await request(app.getHttpServer())
        .post('/customers')
        .set(getAuthHeaders(authToken))
        .send(invalidCustomerData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('email');
    });

    it('should validate phone number format when provided', async () => {
      const { app } = context;

      const invalidCustomerData = {
        name: 'Invalid Phone Customer',
        email: 'phone.test@example.com',
        phone: 'not-a-phone',
        organization_id: testOrganizationId,
      };

      const response = await request(app.getHttpServer())
        .post('/customers')
        .set(getAuthHeaders(authToken))
        .send(invalidCustomerData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('phone');
    });

    it('should enforce valid status transitions', async () => {
      const { app, dataSource } = context;

      // Create a customer for testing status validation
      const customerRepo = dataSource.getRepository('Customer');
      const testCustomer = await customerRepo.save({
        organization_id: testOrganizationId,
        name: 'Status Validation Customer',
        email: 'status.validation@example.com',
        status: 'lead',
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Try to set an invalid status
      const response = await request(app.getHttpServer())
        .patch(`/customers/${testCustomer.id}`)
        .set(getAuthHeaders(authToken))
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('status');

      // Cleanup
      await customerRepo.delete({ id: testCustomer.id });
    });
  });

  describe('Scenario 7: Performance and Scalability', () => {
    it('should handle multiple customer requests within acceptable time', async () => {
      const { app } = context;
      const startTime = Date.now();

      // Make multiple customer-related requests
      const requests = [
        request(app.getHttpServer())
          .get('/customers')
          .set(getAuthHeaders(authToken)),
        request(app.getHttpServer())
          .get(`/customers/${testCustomerId}`)
          .set(getAuthHeaders(authToken)),
        request(app.getHttpServer())
          .get('/customers?status=lead')
          .set(getAuthHeaders(authToken)),
      ];

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // Total time should be less than 2 seconds for acceptance test
      expect(totalTime).toBeLessThan(2000);
    });

    it('should maintain performance with pagination for large customer sets', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .get('/customers?limit=10&offset=0')
        .set(getAuthHeaders(authToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Response should respect pagination limits
      expect(response.body.length).toBeLessThanOrEqual(10);
    });

    it('should support sorting customers by creation date', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .get('/customers?sort=created_at&order=desc')
        .set(getAuthHeaders(authToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      // Verify sorting (simplified check - at least should return customers)
      if (response.body.length > 1) {
        const dates = response.body.map((c: any) =>
          new Date(c.created_at).getTime(),
        );
        // Check if dates are in descending order (or at least valid)
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i]).toBeLessThanOrEqual(dates[i - 1]);
        }
      }
    });
  });
});
