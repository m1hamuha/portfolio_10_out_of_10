import { CoachContext, ChatMessage } from './types';
import { streamDeterministicHeuristic } from './mockAiCoach';

export interface ExecuteOptions {
  apiKey?: string;
  forceMock?: boolean;
  modelId?: string;
  timeoutMs?: number;
  onChunk?: (chunk: string, fullTextSoFar: string) => void;
}

export interface ExecuteResult {
  content: string;
  isSimulated: boolean;
  modelUsed: string;
}

export async function executeCopilotChat(
  messages: ChatMessage[],
  context: CoachContext,
  options: ExecuteOptions = {}
): Promise<ExecuteResult> {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || 'Help improve runway';
  const apiKey = options.apiKey || (typeof window !== 'undefined' ? localStorage.getItem('openrouter_api_key') : undefined);
  const forceMock = options.forceMock || !apiKey;

  // Zero-Setup Offline Heuristics Path
  if (forceMock) {
    let fullText = '';
    const delay = typeof window !== 'undefined' && (window as unknown as { __PLAYWRIGHT_TEST__?: boolean }).__PLAYWRIGHT_TEST__ ? 0 : 5;
    for await (const chunk of streamDeterministicHeuristic(lastUserMessage, context, delay)) {
      fullText += chunk;
      options.onChunk?.(chunk, fullText);
    }
    return {
      content: fullText,
      isSimulated: true,
      modelUsed: 'deterministic-heuristics-v1',
    };
  }

  // Live OpenRouter Streaming Path with Automatic Error & Timeout Fallback
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 8000);

  try {
    const systemPrompt = `You are an elite Startup Financial Copilot Coach.
Live Financial Context:
- Active Profile: ${context.activePresetName}
- Cash Balance: $${(context.cashBalanceCents / 100).toLocaleString()}
- Monthly Revenue (MRR): $${(context.mrrCents / 100).toLocaleString()}
- Monthly Expenses: $${(context.monthlyExpensesCents / 100).toLocaleString()}
- Net Monthly Burn: $${(context.netBurnCents / 100).toLocaleString()}
- Runway: ${context.status === 'DEFAULT_ALIVE' ? 'Default Alive (Infinite)' : `${context.runwayMonths.toFixed(1)} months`}
- Gross Margin: ${(context.grossMarginBps / 100).toFixed(1)}%
- Status: ${context.status}

Format your reply strictly as:
### 1. Diagnosis
### 2. Action Plan
### 3. Risks & Financial Sensitivities`;

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5178',
        'X-Title': 'Fintech Dashboard AI Copilot',
      },
      body: JSON.stringify({
        model: options.modelId || 'openai/gpt-4o-mini',
        messages: apiMessages,
        temperature: 0.3,
        stream: true,
      }),
    });

    clearTimeout(timeout);

    if (!response.ok || !response.body) {
      throw new Error(`OpenRouter HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunkStr = decoder.decode(value);
      const lines = chunkStr.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const token = parsed.choices?.[0]?.delta?.content || '';
            if (token) {
              fullContent += token;
              options.onChunk?.(token, fullContent);
            }
          } catch {
            // ignore non-json SSE lines
          }
        }
      }
    }

    return {
      content: fullContent,
      isSimulated: false,
      modelUsed: options.modelId || 'gpt-4o-mini',
    };
  } catch (err) {
    clearTimeout(timeout);
    console.warn(`[AI Copilot] OpenRouter unreachable (${(err as Error).message}). Activating local deterministic heuristics.`);

    // Graceful fallback: stream deterministic response
    let fallbackText = '';
    for await (const chunk of streamDeterministicHeuristic(lastUserMessage, context, 0)) {
      fallbackText += chunk;
      options.onChunk?.(chunk, fallbackText);
    }

    return {
      content: fallbackText,
      isSimulated: true,
      modelUsed: 'deterministic-heuristics-v1 (fallback)',
    };
  }
}
