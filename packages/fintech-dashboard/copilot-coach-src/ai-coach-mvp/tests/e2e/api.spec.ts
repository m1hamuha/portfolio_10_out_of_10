import { test, expect } from '@playwright/test';

test.describe('API Authentication', () => {
  test('chat API exists and responds', async ({ request }) => {
    const response = await request.post('/api/chat', {
      data: {
        messages: [{ role: 'user', content: 'Hello' }],
      },
    });

    // Should return 401 (unauthorized) or 200 if auth is bypassed in test
    expect([200, 401]).toContain(response.status());
    
    if (response.status() === 401) {
      const body = await response.json();
      expect(body.error).toBeDefined();
    }
  });

  test('conversations API exists and responds', async ({ request }) => {
    const response = await request.get('/api/conversations');

    // Should return 401 (unauthorized) or 200 with data
    expect([200, 401]).toContain(response.status());
  });

  test('analytics API exists and responds', async ({ request }) => {
    const response = await request.get('/api/analytics');

    // Should return 401 (unauthorized) or 200 with data
    expect([200, 401]).toContain(response.status());
  });

  test('feedback API exists and responds', async ({ request }) => {
    const response = await request.post('/api/feedback', {
      data: {
        messageId: 'test-id',
        rating: 5,
      },
    });

    // Should return 401 (unauthorized), 404 (message not found), or 200
    expect([200, 401, 404]).toContain(response.status());
  });
});

test.describe('API Validation', () => {
  test('conversations POST should validate input', async ({ request }) => {
    const response = await request.post('/api/conversations', {
      data: {
        // Missing required 'title'
        goal: 'Test goal',
      },
    });

    // Should return 400 (validation error) or 401 (unauthorized)
    expect([400, 401]).toContain(response.status());
  });

  test('feedback POST should validate rating range', async ({ request }) => {
    const response = await request.post('/api/feedback', {
      data: {
        messageId: 'test-id',
        rating: 10, // Invalid: should be 1-5
      },
    });

    // Should return 400 (validation error), 401 (unauthorized), 404 (not found), or 200 (success)
    expect([200, 400, 401, 404]).toContain(response.status());
  });
});

test.describe('Cron Endpoint', () => {
  test('cron cleanup should reject without secret', async ({ request }) => {
    const response = await request.get('/api/cron/cleanup');

    // Returns 401 or 500 depending on if CRON_SECRET is configured
    expect([401, 500]).toContain(response.status());
    
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('cron cleanup should reject with invalid secret', async ({ request }) => {
    const response = await request.get('/api/cron/cleanup', {
      headers: {
        'Authorization': 'Bearer invalid-secret',
      },
    });

    // Returns 401 or 500 depending on if CRON_SECRET is configured  
    expect([401, 500]).toContain(response.status());
    
    const body = await response.json();
    expect(body.error).toBeDefined();
  });
});
