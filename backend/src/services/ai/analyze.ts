import type { Analysis } from "../../types/analysis.js";
import { AnalysisValidationError } from "../../types/analysis.js";
import type { GemmaClient } from "./gemma.js";

function isScore(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

export function parseAnalysisResponse(response: string): Analysis {
  let value: unknown;
  try {
    value = JSON.parse(response);
  } catch {
    throw new AnalysisValidationError("The AI returned malformed JSON.");
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AnalysisValidationError();
  }

  const analysis = value as Record<string, unknown>;
  if (
    typeof analysis.emotion !== "string" ||
    !isScore(analysis.emotionIntensity) ||
    typeof analysis.tone !== "string" ||
    typeof analysis.intent !== "string" ||
    !isScore(analysis.riskScore) ||
    !Array.isArray(analysis.triggers) ||
    !analysis.triggers.every((trigger) => typeof trigger === "string") ||
    typeof analysis.explanation !== "string"
  ) throw new AnalysisValidationError();

  return {
    emotion: analysis.emotion,
    emotionIntensity: analysis.emotionIntensity,
    tone: analysis.tone,
    intent: analysis.intent,
    riskScore: analysis.riskScore,
    triggers: analysis.triggers,
    explanation: analysis.explanation,
  };
}

export class AnalysisService {
  constructor(private readonly gemma: GemmaClient) {}

  async analyze(message: string): Promise<Analysis> {
    return parseAnalysisResponse(await this.gemma.analyze(message));
  }
}
