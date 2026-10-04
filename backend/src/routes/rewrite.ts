import { Router } from "express";

import type { Analysis } from "../types/analysis.js";
import { goals, type Goal, type RewriteInput, RewriteValidationError } from "../types/rewrite.js";
import { RewriteService } from "../services/ai/rewrite.js";
import { OllamaError, OllamaTimeoutError } from "../services/ai/ollama.js";

function isScore(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

function isAnalysis(value: unknown): value is Analysis {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const analysis = value as Record<string, unknown>;
  return typeof analysis.emotion === "string"
    && isScore(analysis.emotionIntensity)
    && typeof analysis.tone === "string"
    && typeof analysis.intent === "string"
    && isScore(analysis.riskScore)
    && Array.isArray(analysis.triggers)
    && analysis.triggers.every((trigger) => typeof trigger === "string")
    && typeof analysis.explanation === "string";
}

function isGoal(value: unknown): value is Goal {
  return typeof value === "string" && (goals as readonly string[]).includes(value);
}

function isRewriteInput(value: unknown): value is RewriteInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const input = value as Record<string, unknown>;
  return typeof input.message === "string" && input.message.trim().length > 0 && input.message.length <= 10_000
    && isAnalysis(input.analysis) && isGoal(input.goal);
}

export function createRewriteRouter(rewriteService: RewriteService) {
  const router = Router();

  router.post("/", async (request, response) => {
    if (!isRewriteInput(request.body)) {
      return response.status(400).json({ error: { code: "VALIDATION_ERROR", message: "message, analysis, and a supported goal are required." } });
    }

    try {
      return response.status(200).json(await rewriteService.rewrite(request.body));
    } catch (error) {
      if (error instanceof RewriteValidationError) {
        return response.status(502).json({ error: { code: "INVALID_AI_RESPONSE", message: "The AI returned an invalid rewrite. Please try again." } });
      }
      if (error instanceof OllamaTimeoutError) {
        return response.status(504).json({ error: { code: "OLLAMA_TIMEOUT", message: "Rewriting took too long. Please try again." } });
      }
      if (error instanceof OllamaError) {
        return response.status(503).json({ error: { code: "OLLAMA_UNAVAILABLE", message: "Local AI is unavailable. Check that Ollama is running." } });
      }
      return response.status(500).json({ error: { code: "REWRITE_FAILED", message: "Versions could not be generated. Please try again." } });
    }
  });

  return router;
}
