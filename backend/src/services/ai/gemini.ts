/**
 * GeminiClient — calls the Google AI Studio generativelanguage API.
 *
 * Production model: gemma-4-27b-it
 *   Gemma 3 is an open-weights model not hosted by the Gemini API.
 *   Gemma 4 (released April 2026) is the current Gemma generation available
 *   through the standard Gemini API key / Google AI Studio.
 *
 * This client implements the same internal generate() contract as OllamaClient
 * so GemmaService can swap between the two transparently.
 * Errors are mapped to OllamaError / OllamaTimeoutError so that existing route
 * error handling requires zero changes.
 */

import { OllamaError, OllamaTimeoutError, type OllamaGenerateRequest } from "./ollama.js";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

/** Default Gemma model available through the Google AI Studio / Gemini API. */
export const GEMINI_DEFAULT_MODEL = "gemma-4-27b-it";

type GeminiContent = {
  role: "user" | "model";
  parts: Array<{ text: string }>;
};

type GeminiGenerationConfig = {
  temperature: number;
  responseMimeType: "application/json";
  responseSchema: Record<string, unknown>;
};

type GeminiRequest = {
  systemInstruction: { parts: Array<{ text: string }> };
  contents: GeminiContent[];
  generationConfig: GeminiGenerationConfig;
};

type GeminiCandidate = {
  content?: { parts?: Array<{ text?: unknown }> };
  finishReason?: string;
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
  error?: { message?: string; code?: number };
};

export class GeminiClient {
  constructor(
    private readonly apiKey = process.env.GEMINI_API_KEY ?? "",
    private readonly model = process.env.GEMINI_MODEL ?? GEMINI_DEFAULT_MODEL,
    private readonly timeoutMs = 45_000,
  ) {}

  /**
   * Accepts the same OllamaGenerateRequest shape so GemmaService needs no
   * structural change to switch providers.
   */
  async generate(request: OllamaGenerateRequest): Promise<string> {
    if (!this.apiKey) {
      throw new OllamaError("GEMINI_API_KEY is not configured.");
    }

    const body: GeminiRequest = {
      systemInstruction: { parts: [{ text: request.system }] },
      contents: [{ role: "user", parts: [{ text: request.prompt }] }],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: request.format,
      },
    };

    const url = new URL(
      `${GEMINI_API_BASE}/models/${encodeURIComponent(this.model)}:generateContent`,
    );
    url.searchParams.set("key", this.apiKey);

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
        throw new OllamaTimeoutError();
      }
      throw new OllamaError("Unable to reach the Gemini API.");
    }

    if (!response.ok) {
      // Do not surface the raw provider body — it may contain key fragments.
      if (response.status === 401 || response.status === 403) {
        throw new OllamaError("Gemini API authentication failed.", response.status);
      }
      if (response.status === 429) {
        throw new OllamaError("Gemini API rate limit reached.", response.status);
      }
      throw new OllamaError("Gemini API returned an unsuccessful response.", response.status);
    }

    let parsed: GeminiResponse;
    try {
      parsed = await response.json() as GeminiResponse;
    } catch {
      throw new OllamaError("Gemini API returned non-JSON.");
    }

    const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string" || !text) {
      throw new OllamaError("Gemini API returned an unexpected response shape.");
    }

    return text;
  }
}
