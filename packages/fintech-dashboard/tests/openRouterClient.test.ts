import { describe, it, expect, vi } from 'vitest';
import { executeCopilotChat } from '../src/engine/openRouterClient';
import { CoachContext, ChatMessage } from '../src/engine/types';

describe('Feature F36: OpenRouter Client & Resilient Fallback Tests', () => {
  const sampleContext: CoachContext = {
    cashBalanceCents: 18_000_000,
    mrrCents: 1_200_000,
    arrCents: 14_400_000,
    monthlyExpensesCents: 6_200_000,
    netBurnCents: 5_000_000,
    runwayMonths: 3.6,
    grossMarginBps: 7000,
    status: 'CRITICAL',
    activePresetName: 'Seed Stage Runway Emergency',
  };

  const messages: ChatMessage[] = [
    {
      id: 'm1',
      role: 'user',
      content: 'Can we afford to hire 2 senior engineers?',
      timestamp: Date.now(),
    },
  ];

  it('executes in offline mock mode when no API key is provided', async () => {
    const chunks: string[] = [];
    const res = await executeCopilotChat(messages, sampleContext, {
      forceMock: true,
      onChunk: (chunk) => {
        chunks.push(chunk);
      },
    });

    expect(res.isSimulated).toBe(true);
    expect(res.modelUsed).toBe('deterministic-heuristics-v1');
    expect(res.content).toContain('### 1. Diagnosis');
    expect(chunks.length).toBeGreaterThan(0);
  });

  it('falls back gracefully to deterministic heuristics on fetch error', async () => {
    // Mock global fetch failure
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error('Network connection refused (offline)'));

    const res = await executeCopilotChat(messages, sampleContext, {
      apiKey: 'sk-mock-key-testing',
      forceMock: false,
      timeoutMs: 1000,
    });

    expect(res.isSimulated).toBe(true);
    expect(res.modelUsed).toContain('fallback');
    expect(res.content).toContain('### 1. Diagnosis');

    global.fetch = originalFetch;
  });

  it('handles empty messages with default prompt', async () => {
    const res = await executeCopilotChat([], sampleContext, { forceMock: true });
    expect(res.content).toBeTruthy();
    expect(res.isSimulated).toBe(true);
  });
});
