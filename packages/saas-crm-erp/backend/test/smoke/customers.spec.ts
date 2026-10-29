import {
  createTestApp,
  cleanupTestApp,
  TestContext,
  setupTestData,
  authenticateTestUser,
  getAuthHeaders,
} from './setup';
import supertest from 'supertest';

describe('Customers Smoke Tests', () => {
  let context: TestContext;
  let authToken: string;
  let testOrganizationId: string;
  let testCustomerId: string;

  beforeAll(async () => {
    context = await createTestApp();
    await setupTestData(context);
    authToken = await authenticateTestUser(context);

    // Get the test organization ID
    const { dataSource } = context;
    const orgRepo = dataSource.getRepository('Organization');
    const organization = await orgRepo.findOne({
      where: { name: 'Test Organization' },
    });
    testOrganizationId = organization!.id;

    // Create a test customer
    const customerRepo = dataSource.getRepository('Customer');
    const testCustomer = await customerRepo.save({
      organization_id: testOrganizationId,
      first_name: 'Test',
      last_name: 'Customer',
      email: 'customer@example.com',
      phone: '+1234567890',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });
    testCustomerId = testCustomer.id;
  });

  afterAll(async () => {
    await cleanupTestApp(context);
  });

  describe('GET /customers', () => {
    it('should return list of customers', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .get('/customers')
        .set(getAuthHeaders(authToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Check structure of first customer
      if (response.body.length > 0) {
        const customer = response.body[0];
        expect(customer).toHaveProperty('id');
        expect(customer).toHaveProperty('first_name');
        expect(customer).toHaveProperty('last_name');
        expect(customer).toHaveProperty('email');
        expect(customer).toHaveProperty('organization_id');
        expect(customer).toHaveProperty('status');
        expect(customer).toHaveProperty('created_at');
        expect(customer).toHaveProperty('updated_at');
      }
    });

    it('should filter customers by organization', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .get(`/customers?organization_id=${testOrganizationId}`)
        .set(getAuthHeaders(authToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      // All returned customers should belong to the test organization
      if (response.body.length > 0) {
        response.body.forEach((customer: any) => {
          expect(customer.organization_id).toBe(testOrganizationId);
        });
      }
    });

    it('should filter customers by status', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .get('/customers?status=active')
        .set(getAuthHeaders(authToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      // All returned customers should have status 'active'
      if (response.body.length > 0) {
        response.body.forEach((customer: any) => {
          expect(customer.status).toBe('active');
        });
      }
    });

    it('should search customers by name', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .get('/customers?search=Test')
        .set(getAuthHeaders(authToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      // At least one customer should match the search
      if (response.body.length > 0) {
        const hasTestCustomer = response.body.some(
          (customer: any) =>
            customer.first_name.includes('Test') ||
            customer.last_name.includes('Test'),
        );
        expect(hasTestCustomer).toBe(true);
      }
    });
  });

  describe('GET /customers/:id', () => {
    it('should return customer by ID', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .get(`/customers/${testCustomerId}`)
        .set(getAuthHeaders(authToken))
        .expect(200);

      expect(response.body).toHaveProperty('id', testCustomerId);
      expect(response.body).toHaveProperty('first_name', 'Test');
      expect(response.body).toHaveProperty('last_name', 'Customer');
      expect(response.body).toHaveProperty('email', 'customer@example.com');
      expect(response.body).toHaveProperty(
        'organization_id',
        testOrganizationId,
      );
      expect(response.body).toHaveProperty('status', 'active');
    });

    it('should return 404 for non-existent customer', async () => {
      const { app } = context;

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .get(`/customers/${nonExistentId}`)
        .set(getAuthHeaders(authToken))
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Customer not found');
      expect(response.body).toHaveProperty('statusCode', 404);
    });

    it('should enforce tenant isolation - cannot access other organization customers', async () => {
      const { app, dataSource } = context;

      // Create another organization and customer
      const orgRepo = dataSource.getRepository('Organization');
      const otherOrg = await orgRepo.save({
        name: 'Other Organization',
        domain: 'other.local',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const customerRepo = dataSource.getRepository('Customer');
      const otherCustomer = await customerRepo.save({
        organization_id: otherOrg.id,
        first_name: 'Other',
        last_name: 'Customer',
        email: 'other@example.com',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Try to access other organization's customer (should fail due to tenant isolation)
      const response = await request(app.getHttpServer())
        .get(`/customers/${otherCustomer.id}`)
        .set(getAuthHeaders(authToken))
        .expect(404); // Or 403 depending on implementation

      expect(response.body).toHaveProperty('message');

      // Cleanup
      await customerRepo.delete({ id: otherCustomer.id });
      await orgRepo.delete({ id: otherOrg.id });
    });
  });

  describe('POST /customers', () => {
    it('should create a new customer', async () => {
      const { app, dataSource } = context;

      const newCustomerData = {
        first_name: 'New',
        last_name: 'Customer',
        email: 'new.customer@example.com',
        phone: '+9876543210',
        status: 'active',
        organization_id: testOrganizationId,
      };

      const response = await request(app.getHttpServer())
        .post('/customers')
        .set(getAuthHeaders(authToken))
        .send(newCustomerData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty(
        'first_name',
        newCustomerData.first_name,
      );
      expect(response.body).toHaveProperty(
        'last_name',
        newCustomerData.last_name,
      );
      expect(response.body).toHaveProperty('email', newCustomerData.email);
      expect(response.body).toHaveProperty('phone', newCustomerData.phone);
      expect(response.body).toHaveProperty('status', newCustomerData.status);
      expect(response.body).toHaveProperty(
        'organization_id',
        testOrganizationId,
      );
      expect(response.body).toHaveProperty('created_at');
      expect(response.body).toHaveProperty('updated_at');

      // Cleanup
      const customerRepo = dataSource.getRepository('Customer');
      await customerRepo.delete({ id: response.body.id });
    });

    it('should validate required fields', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .post('/customers')
        .set(getAuthHeaders(authToken))
        .send({
          // Missing required fields
          first_name: 'Test',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('last_name');
      expect(response.body.message).toContain('email');
    });

    it('should validate email format', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .post('/customers')
        .set(getAuthHeaders(authToken))
        .send({
          first_name: 'Test',
          last_name: 'Customer',
          email: 'invalid-email',
          organization_id: testOrganizationId,
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('email');
    });

    it('should prevent duplicate email within organization', async () => {
      const { app } = context;

      const duplicateCustomerData = {
        first_name: 'Duplicate',
        last_name: 'Customer',
        email: 'customer@example.com', // Same as existing test customer
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
  });

  describe('PATCH /customers/:id', () => {
    it('should update customer', async () => {
      const { app, dataSource } = context;

      // Create a test customer to update
      const customerRepo = dataSource.getRepository('Customer');
      const testCustomer = await customerRepo.save({
        organization_id: testOrganizationId,
        first_name: 'Original',
        last_name: 'Name',
        email: 'original@example.com',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const updateData = {
        first_name: 'Updated',
        last_name: 'Customer',
        status: 'inactive',
      };

      const response = await request(app.getHttpServer())
        .patch(`/customers/${testCustomer.id}`)
        .set(getAuthHeaders(authToken))
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('id', testCustomer.id);
      expect(response.body).toHaveProperty('first_name', updateData.first_name);
      expect(response.body).toHaveProperty('last_name', updateData.last_name);
      expect(response.body).toHaveProperty('status', updateData.status);
      expect(response.body).toHaveProperty('email', testCustomer.email); // Should remain unchanged

      // Verify the update persisted
      const updatedCustomer = await customerRepo.findOne({
        where: { id: testCustomer.id },
      });
      expect(updatedCustomer!.first_name).toBe(updateData.first_name);
      expect(updatedCustomer!.status).toBe(updateData.status);

      // Cleanup
      await customerRepo.delete({ id: testCustomer.id });
    });

    it('should return 404 when updating non-existent customer', async () => {
      const { app } = context;

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .patch(`/customers/${nonExistentId}`)
        .set(getAuthHeaders(authToken))
        .send({ first_name: 'Updated' })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Customer not found');
    });
  });

  describe('DELETE /customers/:id', () => {
    it('should delete customer', async () => {
      const { app, dataSource } = context;

      // Create a test customer to delete
      const customerRepo = dataSource.getRepository('Customer');
      const testCustomer = await customerRepo.save({
        organization_id: testOrganizationId,
        first_name: 'To Delete',
        last_name: 'Customer',
        email: 'delete@example.com',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const response = await request(app.getHttpServer())
        .delete(`/customers/${testCustomer.id}`)
        .set(getAuthHeaders(authToken))
        .expect(200);

      expect(response.body).toHaveProperty(
        'message',
        'Customer deleted successfully',
      );

      // Verify the customer is deleted
      const deletedCustomer = await customerRepo.findOne({
        where: { id: testCustomer.id },
      });
      expect(deletedCustomer).toBeNull();
    });

    it('should return 404 when deleting non-existent customer', async () => {
      const { app } = context;

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .delete(`/customers/${nonExistentId}`)
        .set(getAuthHeaders(authToken))
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Customer not found');
    });
  });

  describe('Customer Notes Endpoint', () => {
    it('should get notes for customer', async () => {
      const { app } = context;

      const response = await request(app.getHttpServer())
        .get(`/customers/${testCustomerId}/notes`)
        .set(getAuthHeaders(authToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should add note to customer', async () => {
      const { app } = context;

      const noteData = {
        content: 'Test note for customer',
        type: 'general',
      };

      const response = await request(app.getHttpServer())
        .post(`/customers/${testCustomerId}/notes`)
        .set(getAuthHeaders(authToken))
        .send(noteData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('content', noteData.content);
      expect(response.body).toHaveProperty('type', noteData.type);
      expect(response.body).toHaveProperty('customer_id', testCustomerId);
      expect(response.body).toHaveProperty('created_by');
      expect(response.body).toHaveProperty('created_at');
    });
  });

  describe('Data Validation and Sanitization', () => {
    it('should sanitize HTML in customer fields', async () => {
      const { app, dataSource } = context;

      const maliciousData = {
        first_name: '<script>alert("xss")</script>John',
        last_name: 'Doe<script>evil()</script>',
        email: 'test@example.com',
        organization_id: testOrganizationId,
      };

      const response = await request(app.getHttpServer())
        .post('/customers')
        .set(getAuthHeaders(authToken))
        .send(maliciousData)
        .expect(201);

      // Check that script tags are sanitized
      expect(response.body.first_name).not.toContain('<script>');
      expect(response.body.last_name).not.toContain('<script>');

      // Cleanup
      const customerRepo = dataSource.getRepository('Customer');
      await customerRepo.delete({ id: response.body.id });
    });

    it('should trim whitespace from input fields', async () => {
      const { app, dataSource } = context;

      const dataWithWhitespace = {
        first_name: '  John  ',
        last_name: '  Doe  ',
        email: '  test@example.com  ',
        organization_id: testOrganizationId,
      };

      const response = await request(app.getHttpServer())
        .post('/customers')
        .set(getAuthHeaders(authToken))
        .send(dataWithWhitespace)
        .expect(201);

      expect(response.body.first_name).toBe('John');
      expect(response.body.last_name).toBe('Doe');
      expect(response.body.email).toBe('test@example.com');

      // Cleanup
      const customerRepo = dataSource.getRepository('Customer');
      await customerRepo.delete({ id: response.body.id });
    });
  });
});

// Helper function for making requests
function request(server: any) {
  return supertest(server);
}
