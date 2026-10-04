import { analysisPrompt } from "../../prompts/prompts.js";
import { rewritePrompt } from "../../prompts/prompts.js";
import type { RewriteInput } from "../../types/rewrite.js";
import { GeminiClient } from "./gemini.js";
import { OllamaClient } from "./ollama.js";

export interface GemmaClient {
  analyze(message: string): Promise<string>;
}

export interface GemmaRewriteClient {
  rewrite(input: RewriteInput): Promise<string>;
}

const analysisSchema = {
  type: "object",
  properties: {
    emotion: { type: "string" },
    emotionIntensity: { type: "number", minimum: 0, maximum: 100 },
    tone: { type: "string" },
    intent: { type: "string" },
    riskScore: { type: "number", minimum: 0, maximum: 100 },
    triggers: { type: "array", items: { type: "string" } },
    explanation: { type: "string" },
  },
  required: ["emotion", "emotionIntensity", "tone", "intent", "riskScore", "triggers", "explanation"],
  additionalProperties: false,
} as const;

const rewriteSchema = {
  type: "object",
  properties: {
    calm: { type: "object", properties: { message: { type: "string" }, riskScore: { type: "number", minimum: 0, maximum: 100 } }, required: ["message", "riskScore"], additionalProperties: false },
    firm: { type: "object", properties: { message: { type: "string" }, riskScore: { type: "number", minimum: 0, maximum: 100 } }, required: ["message", "riskScore"], additionalProperties: false },
    direct: { type: "object", properties: { message: { type: "string" }, riskScore: { type: "number", minimum: 0, maximum: 100 } }, required: ["message", "riskScore"], additionalProperties: false },
  },
  required: ["calm", "firm", "direct"],
  additionalProperties: false,
} as const;

/**
 * Selects the inference back-end at construction time.
 *
 * Local development  (GEMINI_API_KEY absent/empty):
 *   OllamaClient → local Ollama → Gemma 3
 *
 * Production        (GEMINI_API_KEY set):
 *   GeminiClient → Google AI Studio → Gemma 4 (gemma-4-27b-it)
 *
 * The public analyze() / rewrite() interface is identical in both cases.
 */
function buildInferenceClient(): OllamaClient | GeminiClient {
  return process.env.GEMINI_API_KEY?.trim()
    ? new GeminiClient()
    : new OllamaClient();
}

export class GemmaService implements GemmaClient, GemmaRewriteClient {
  private readonly client: OllamaClient | GeminiClient;
  private readonly model: string | undefined;

  constructor(
    client?: OllamaClient | GeminiClient,
    model?: string,
  ) {
    this.client = client ?? buildInferenceClient();
    // model is only needed for OllamaClient; GeminiClient reads it from env itself
    this.model = model ?? process.env.OLLAMA_MODEL;
  }

  async analyze(message: string): Promise<string> {
    if (this.client instanceof OllamaClient && !this.model) {
      throw new Error("OLLAMA_MODEL must be configured.");
    }

    return this.client.generate({
      model: this.model ?? "",
      system: analysisPrompt,
      prompt: `User message:\n${message}`,
      format: analysisSchema,
    });
  }

  async rewrite(input: RewriteInput): Promise<string> {
    if (this.client instanceof OllamaClient && !this.model) {
      throw new Error("OLLAMA_MODEL must be configured.");
    }

    return this.client.generate({
      model: this.model ?? "",
      system: rewritePrompt,
      prompt: `Original message:\n${input.message}\n\nCommunication analysis:\n${JSON.stringify(input.analysis)}\n\nUser's actual goal:\n${input.goal}`,
      format: rewriteSchema,
    });
  }
}
