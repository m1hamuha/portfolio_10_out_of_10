import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '../../lib/prompt';

describe('buildSystemPrompt', () => {
  it('includes goal', () => {
    const p = buildSystemPrompt({ userGoal: 'ship MVP', context: '' });
    expect(p).toContain('ship MVP');
  });
});