import { describe, it, expect } from 'vitest';
import { RATE_LIMITS } from '@/lib/security';

describe('Rate Limiting Configuration', () => {
  describe('RATE_LIMITS', () => {
    it('has chat configuration', () => {
      expect(RATE_LIMITS.chat).toBeDefined();
      expect(RATE_LIMITS.chat.endpoint).toBe('chat');
      expect(RATE_LIMITS.chat.maxRequests).toBe(100);
      expect(RATE_LIMITS.chat.windowMs).toBe(15 * 60 * 1000);
    });

    it('has conversations configuration', () => {
      expect(RATE_LIMITS.conversations).toBeDefined();
      expect(RATE_LIMITS.conversations.endpoint).toBe('conversations');
      expect(RATE_LIMITS.conversations.maxRequests).toBe(30);
      expect(RATE_LIMITS.conversations.windowMs).toBe(60 * 1000);
    });

    it('has feedback configuration', () => {
      expect(RATE_LIMITS.feedback).toBeDefined();
      expect(RATE_LIMITS.feedback.endpoint).toBe('feedback');
      expect(RATE_LIMITS.feedback.maxRequests).toBe(20);
      expect(RATE_LIMITS.feedback.windowMs).toBe(60 * 1000);
    });

    it('has analytics configuration', () => {
      expect(RATE_LIMITS.analytics).toBeDefined();
      expect(RATE_LIMITS.analytics.endpoint).toBe('analytics');
      expect(RATE_LIMITS.analytics.maxRequests).toBe(10);
      expect(RATE_LIMITS.analytics.windowMs).toBe(60 * 1000);
    });

    it('has health configuration', () => {
      expect(RATE_LIMITS.health).toBeDefined();
      expect(RATE_LIMITS.health.endpoint).toBe('health');
      expect(RATE_LIMITS.health.maxRequests).toBe(60);
      expect(RATE_LIMITS.health.windowMs).toBe(60 * 1000);
    });

    it('has reasonable rate limits', () => {
      expect(RATE_LIMITS.chat.maxRequests).toBeGreaterThan(RATE_LIMITS.analytics.maxRequests);
      expect(RATE_LIMITS.feedback.maxRequests).toBeGreaterThanOrEqual(10);
      expect(RATE_LIMITS.health.maxRequests).toBeLessThanOrEqual(60);
    });
  });
});
