import assert from "node:assert/strict";
import test from "node:test";
import { GeminiClient, GEMINI_DEFAULT_MODEL } from "./gemini.js";
import { OllamaError, OllamaTimeoutError } from "./ollama.js";

test("GeminiClient handles missing API key", async () => {
  const client = new GeminiClient("");
  await assert.rejects(
    client.generate({ model: "", system: "", prompt: "", format: {} }),
    (err: Error) => err instanceof OllamaError && err.message.includes("GEMINI_API_KEY")
  );
});

// Since we cannot hit the real Google API without a key, we just test the instantiation
test("GeminiClient initializes correctly", () => {
  const client = new GeminiClient("fake-key");
  assert.ok(client);
});
