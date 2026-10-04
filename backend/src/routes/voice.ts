import { Router } from "express";

import { maxVoiceTextLength, type VoiceAudio } from "../types/voice.js";
import {
  ElevenLabsVoiceService,
  VoiceAuthenticationError,
  VoiceConfigurationError,
  VoiceRateLimitError,
  VoiceTimeoutError,
  VoiceUpstreamError,
} from "../services/voice/elevenlabs.js";

export type VoiceService = {
  generateSpeech(text: string): Promise<VoiceAudio>;
};

function getValidText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text || text.length > maxVoiceTextLength) return null;
  return text;
}

export function createVoiceRouter(voiceService: VoiceService = new ElevenLabsVoiceService()) {
  const router = Router();

  router.post("/", async (request, response) => {
    const text = getValidText(request.body?.text);
    if (!text) {
      return response.status(400).json({ error: "A non-empty text string up to 1200 characters is required." });
    }

    try {
      const result = await voiceService.generateSpeech(text);
      response.setHeader("Content-Type", result.contentType);
      response.setHeader("Cache-Control", "no-store");
      return response.status(200).send(result.audio);
    } catch (error) {
      if (error instanceof VoiceConfigurationError) {
        return response.status(500).json({ error: "Voice generation is currently unavailable." });
      }
      if (error instanceof VoiceAuthenticationError || error instanceof VoiceUpstreamError) {
        return response.status(502).json({ error: "Voice generation is currently unavailable." });
      }
      if (error instanceof VoiceRateLimitError || error instanceof VoiceTimeoutError) {
        return response.status(503).json({ error: "Voice generation is currently unavailable." });
      }
      return response.status(500).json({ error: "Voice generation is currently unavailable." });
    }
  });

  return router;
}
