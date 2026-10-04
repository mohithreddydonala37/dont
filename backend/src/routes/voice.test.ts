import assert from "node:assert/strict";
import test from "node:test";

import { maxVoiceTextLength, type VoiceAudio } from "../types/voice.js";
import { createVoiceRouter, type VoiceService } from "./voice.js";
import {
  VoiceAuthenticationError,
  VoiceConfigurationError,
  VoiceTimeoutError,
} from "../services/voice/elevenlabs.js";

async function withVoiceServer(service: VoiceService, run: (baseUrl: string) => Promise<void>) {
  process.env.NODE_ENV = "test";
  const express = (await import("express")).default;
  const app = express();
  app.use(express.json({ limit: "12kb" }));
  app.use("/api/voice", createVoiceRouter(service));
  const server = app.listen();
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

function okService(onText?: (text: string) => void): VoiceService {
  return {
    async generateSpeech(text: string): Promise<VoiceAudio> {
      onText?.(text);
      return { audio: Buffer.from([0x49, 0x44, 0x33, 0x03]), contentType: "audio/mpeg" };
    },
  };
}

test("POST /api/voice returns audio/mpeg for valid text", async () => {
  await withVoiceServer(okService(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/voice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "I want to talk this through calmly." }),
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "audio/mpeg");
    assert.equal((await response.arrayBuffer()).byteLength, 4);
  });
});

test("POST /api/voice trims text before generating speech", async () => {
  let generatedText = "";
  await withVoiceServer(okService((text) => { generatedText = text; }), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/voice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "  Please hear me out.  " }),
    });

    assert.equal(response.status, 200);
    assert.equal(generatedText, "Please hear me out.");
  });
});

test("POST /api/voice rejects missing text", async () => {
  await withVoiceServer(okService(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/voice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    assert.equal(response.status, 400);
  });
});

test("POST /api/voice rejects empty text", async () => {
  await withVoiceServer(okService(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/voice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "" }),
    });

    assert.equal(response.status, 400);
  });
});

test("POST /api/voice rejects whitespace-only text", async () => {
  await withVoiceServer(okService(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/voice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "   \n\t  " }),
    });

    assert.equal(response.status, 400);
  });
});

test("POST /api/voice rejects overly long text", async () => {
  await withVoiceServer(okService(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/voice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "a".repeat(maxVoiceTextLength + 1) }),
    });

    assert.equal(response.status, 400);
  });
});

test("POST /api/voice hides missing configuration details", async () => {
  await withVoiceServer({ generateSpeech: async () => { throw new VoiceConfigurationError("missing key"); } }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/voice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Please say this." }),
    });

    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: "Voice generation is currently unavailable." });
  });
});

test("POST /api/voice maps ElevenLabs authentication failure to a safe 502", async () => {
  await withVoiceServer({ generateSpeech: async () => { throw new VoiceAuthenticationError("bad key"); } }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/voice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Please say this." }),
    });

    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: "Voice generation is currently unavailable." });
  });
});

test("POST /api/voice maps ElevenLabs timeout to a safe 503", async () => {
  await withVoiceServer({ generateSpeech: async () => { throw new VoiceTimeoutError("timeout"); } }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/voice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Please say this." }),
    });

    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "Voice generation is currently unavailable." });
  });
});
