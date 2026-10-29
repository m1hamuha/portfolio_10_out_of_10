import { describe, it, expect } from 'vitest';
import { openRouterModels, calculateCost, getOpenRouterHeaders } from '@/lib/openrouter';

describe('OpenRouter Utilities', () => {
  describe('calculateCost', () => {
    it('calculates cost for GPT-4o', () => {
      const cost = calculateCost('gpt-4o', 1000, 2000);
      expect(cost).toBeCloseTo(0.0225, 4);
    });

    it('calculates cost for GPT-4o-mini', () => {
      const cost = calculateCost('gpt-4o-mini', 1000, 2000);
      expect(cost).toBeCloseTo(0.00135, 5);
    });

    it('calculates cost for Claude 3.5 Sonnet', () => {
      const cost = calculateCost('claude-3-5-sonnet', 1000, 2000);
      expect(cost).toBe(0.033);
    });

    it('throws error for unknown model', () => {
      expect(() => calculateCost('unknown-model' as any, 1000, 2000)).toThrow('Unknown model');
    });

    it('returns 0 for zero tokens', () => {
      const cost = calculateCost('gpt-4o-mini', 0, 0);
      expect(cost).toBe(0);
    });
  });

  describe('getOpenRouterHeaders', () => {
    it('returns headers with API key', () => {
      const headers = getOpenRouterHeaders();
      expect(headers['Authorization']).toContain('Bearer');
      expect(headers['Authorization']).toBeTruthy();
    });

    it('includes HTTP-Referer header', () => {
      const headers = getOpenRouterHeaders();
      expect(headers['HTTP-Referer']).toBeTruthy();
    });

    it('includes X-Title header', () => {
      const headers = getOpenRouterHeaders();
      expect(headers['X-Title']).toBeTruthy();
    });
  });

  describe('openRouterModels', () => {
    it('has all expected models', () => {
      expect(openRouterModels['gpt-4o']).toBeDefined();
      expect(openRouterModels['gpt-4o-mini']).toBeDefined();
      expect(openRouterModels['claude-3-5-sonnet']).toBeDefined();
      expect(openRouterModels['claude-3-haiku']).toBeDefined();
      expect(openRouterModels['deepseek-chat']).toBeDefined();
      expect(openRouterModels['mistral-large']).toBeDefined();
    });

    it('has required properties for each model', () => {
      Object.entries(openRouterModels).forEach(([key, model]) => {
        expect(model.id).toBeTruthy();
        expect(model.name).toBeTruthy();
        expect(model.provider).toBeTruthy();
        expect(typeof model.inputCost).toBe('number');
        expect(typeof model.outputCost).toBe('number');
        expect(typeof model.maxTokens).toBe('number');
      });
    });

    it('has cost-effective models available', () => {
      expect(openRouterModels['gpt-4o-mini'].inputCost).toBeLessThan(openRouterModels['gpt-4o'].inputCost);
      expect(openRouterModels['gpt-4o-mini'].outputCost).toBeLessThan(openRouterModels['gpt-4o'].outputCost);
    });
  });
});
