export const openRouterModels = {
  "gpt-4o": {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    inputCost: 2.5,
    outputCost: 10.0,
    maxTokens: 128000,
  },
  "gpt-4o-mini": {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o-mini",
    provider: "OpenAI",
    inputCost: 0.15,
    outputCost: 0.6,
    maxTokens: 128000,
  },
  "claude-3-5-sonnet": {
    id: "anthropic/claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    inputCost: 3.0,
    outputCost: 15.0,
    maxTokens: 200000,
  },
  "claude-3-haiku": {
    id: "anthropic/claude-3-haiku-20240307",
    name: "Claude 3 Haiku",
    provider: "Anthropic",
    inputCost: 0.25,
    outputCost: 1.25,
    maxTokens: 200000,
  },
  "deepseek-chat": {
    id: "deepseek/deepseek-chat",
    name: "DeepSeek Chat",
    provider: "DeepSeek",
    inputCost: 0.14,
    outputCost: 0.28,
    maxTokens: 32768,
  },
  "mistral-large": {
    id: "mistralai/mistral-large",
    name: "Mistral Large",
    provider: "Mistral",
    inputCost: 2.0,
    outputCost: 6.0,
    maxTokens: 32768,
  },
};

export type ModelId = keyof typeof openRouterModels;

export function getModelInfo(modelId: ModelId) {
  return openRouterModels[modelId];
}

export function calculateCost(
  modelId: ModelId,
  inputTokens: number,
  outputTokens: number
): number {
  const model = openRouterModels[modelId];
  if (!model) {
    throw new Error(`Unknown model: ${modelId}`);
  }
  const inputCost = (inputTokens / 1000000) * model.inputCost;
  const outputCost = (outputTokens / 1000000) * model.outputCost;
  return inputCost + outputCost;
}

export function getOpenRouterHeaders() {
  return {
    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
    "X-Title": process.env.OPENROUTER_APP_NAME || "AI CopilotCoach",
  };
}
