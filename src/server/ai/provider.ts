/**
 * Model provider behind an interface (CLAUDE.md: external services have a `fake`). The model ids
 * come from `AI_MODEL_DEFAULT` and `AI_MODEL_FAST`, never from the code (CLAUDE.md § 12).
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";

export type ModelTier = "default" | "fast";

export type GenerateInput<T> = {
  tier: ModelTier;
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  maxTokens?: number;
  /** The deterministic answer: used by the fake provider, and when the model output is rejected. */
  template: () => T;
};

export type GenerateResult<T> = {
  /** Null when the model refused or its output did not pass validation. */
  output: T | null;
  model: string;
  inputTokens: number;
  outputTokens: number;
};

export interface AiProvider {
  readonly name: string;
  generate<T>(input: GenerateInput<T>): Promise<GenerateResult<T>>;
}

export class AiUnavailableError extends Error {
  constructor(cause?: unknown) {
    super("AI provider unavailable", { cause });
  }
}

export function modelFor(tier: ModelTier): string {
  const value = tier === "fast" ? process.env.AI_MODEL_FAST : process.env.AI_MODEL_DEFAULT;
  if (!value) throw new AiUnavailableError(`AI_MODEL_${tier.toUpperCase()} is not set`);
  return value;
}

const DEFAULT_MAX_TOKENS = 8000;

export class AnthropicProvider implements AiProvider {
  readonly name = "anthropic";
  private readonly client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey, maxRetries: 2, timeout: 120_000 });
  }

  async generate<T>(input: GenerateInput<T>): Promise<GenerateResult<T>> {
    const model = modelFor(input.tier);
    try {
      const response = await this.client.messages.parse({
        model,
        max_tokens:
          input.maxTokens ?? (Number(process.env.AI_MAX_TOKENS_DEFAULT) || DEFAULT_MAX_TOKENS),
        system: input.system,
        messages: [{ role: "user", content: input.prompt }],
        output_config: { format: zodOutputFormat(input.schema) },
      });
      const usage = {
        model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      };
      if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
        return { output: null, ...usage };
      }
      const checked = input.schema.safeParse(response.parsed_output);
      return { output: checked.success ? checked.data : null, ...usage };
    } catch (error) {
      if (error instanceof Anthropic.APIError || error instanceof Anthropic.APIConnectionError)
        throw new AiUnavailableError(error);
      // A response that does not parse as the expected JSON is a rejected output, not an outage.
      if (error instanceof SyntaxError)
        return { output: null, model, inputTokens: 0, outputTokens: 0 };
      throw error;
    }
  }
}

/** Local, preview and tests: the deterministic template, at no cost. */
export class FakeProvider implements AiProvider {
  readonly name = "fake";

  async generate<T>(input: GenerateInput<T>): Promise<GenerateResult<T>> {
    return { output: input.template(), model: "fake", inputTokens: 0, outputTokens: 0 };
  }
}

/** `AI_PROVIDER=fake` forces the fake; otherwise Claude when a key is set. */
export function aiProvider(): AiProvider {
  const key = process.env.ANTHROPIC_API_KEY;
  if (process.env.AI_PROVIDER === "fake" || !key) return new FakeProvider();
  return new AnthropicProvider(key);
}
