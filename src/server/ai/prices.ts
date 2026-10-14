/**
 * Public prices per million tokens (USD), to estimate the cost logged in AiUsage. Reference data
 * only: which model runs is chosen by environment variables. An unknown model costs 0 and is
 * flagged in /admin/ia.
 */
const PRICES: Record<string, { input: number; output: number }> = {
  "claude-opus-5-5": { input: 4, output: 20 },
  "claude-sonnet-5-5": { input: 2, output: 10 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
  "claude-sonnet-5": { input: 2, output: 10 },
  "claude-haiku-4-5": { input: 1, output: 5 },
};

export function hasPrice(model: string) {
  return model in PRICES || model === "fake";
}

/** Cost in micro-dollars: tokens × $ per million tokens. */
export function costMicroUsd(model: string, inputTokens: number, outputTokens: number) {
  const price = PRICES[model];
  if (!price) return 0;
  return Math.round(inputTokens * price.input + outputTokens * price.output);
}
