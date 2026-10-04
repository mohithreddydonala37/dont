import { Router } from "express";

import { AnalysisValidationError } from "../types/analysis.js";
import { AnalysisService } from "../services/ai/analyze.js";
import { OllamaError, OllamaTimeoutError } from "../services/ai/ollama.js";

export function createAnalyzeRouter(analysisService: AnalysisService) {
  const router = Router();

  router.post("/analyze", async (request, response) => {
    const { message } = request.body ?? {};
    if (typeof message !== "string" || !message.trim()) {
      return response.status(400).json({ error: { code: "VALIDATION_ERROR", message: "message must be a non-empty string." } });
    }
    if (message.length > 10_000) {
      return response.status(400).json({ error: { code: "VALIDATION_ERROR", message: "message must be 10,000 characters or fewer." } });
    }

    try {
      return response.status(200).json(await analysisService.analyze(message));
    } catch (error) {
      if (error instanceof AnalysisValidationError) {
        return response.status(502).json({ error: { code: "INVALID_AI_RESPONSE", message: "The AI returned an invalid analysis. Please try again." } });
      }
      if (error instanceof OllamaTimeoutError) {
        return response.status(504).json({ error: { code: "OLLAMA_TIMEOUT", message: "Analysis took too long. Please try again." } });
      }
      if (error instanceof OllamaError) {
        return response.status(503).json({ error: { code: "OLLAMA_UNAVAILABLE", message: "Local AI is unavailable. Check that Ollama is running." } });
      }
      return response.status(500).json({ error: { code: "ANALYSIS_FAILED", message: "Analysis could not be completed." } });
    }
  });

  return router;
}
