import { describe, it, expect } from 'vitest';
import { getSteps, emptyAnswers } from '../questions';

describe('kostin-erp-audit diagnostic questions', () => {
  it('loads diagnostic assessment steps and empty answers', () => {
    expect(emptyAnswers).toBeDefined();
    expect(emptyAnswers.integrations).toEqual([]);
    const steps = getSteps('en');
    expect(steps).toBeDefined();
    expect(Array.isArray(steps)).toBe(true);
    expect(steps.length).toBeGreaterThan(0);
  });
});
