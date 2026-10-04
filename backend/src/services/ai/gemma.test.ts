import assert from "node:assert/strict";
import test from "node:test";
import { GemmaService } from "./gemma.js";
import { GeminiClient } from "./gemini.js";
import { OllamaClient } from "./ollama.js";

test("GemmaService selects OllamaClient when GEMINI_API_KEY is absent", () => {
  const originalKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  const service = new GemmaService();
  // We can inspect the private client property for testing purposes
  assert.ok((service as any).client instanceof OllamaClient);

  if (originalKey) process.env.GEMINI_API_KEY = originalKey;
});

test("GemmaService selects GeminiClient when GEMINI_API_KEY is present", () => {
  const originalKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "test-key";

  const service = new GemmaService();
  assert.ok((service as any).client instanceof GeminiClient);

  if (originalKey !== undefined) {
    process.env.GEMINI_API_KEY = originalKey;
  } else {
    delete process.env.GEMINI_API_KEY;
  }
});
