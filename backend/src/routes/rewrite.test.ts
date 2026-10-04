import assert from "node:assert/strict";
import test from "node:test";

import { RewriteService } from "../services/ai/rewrite.js";

const analysis = {
  emotion: "frustration",
  emotionIntensity: 87,
  tone: "aggressive",
  intent: "express frustration",
  riskScore: 82,
  triggers: ["You never", "You always"],
  explanation: "Absolute language may increase escalation.",
};

const rewrite = {
  calm: { message: "I feel unheard, and I want to talk when we can both listen.", riskScore: 24 },
  firm: { message: "I need to feel heard. Let's continue when we can talk respectfully.", riskScore: 33 },
  direct: { message: "I feel unheard. I need to pause this conversation.", riskScore: 28 },
};

async function withServer(run: (baseUrl: string) => Promise<void>) {
  process.env.NODE_ENV = "test";
  const { createApp } = await import("../server.js");
  const server = createApp(undefined, new RewriteService({ rewrite: async () => JSON.stringify(rewrite) })).listen();
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("POST /api/rewrite returns validated Gemma rewrites", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/rewrite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "You never listen to me.", analysis, goal: "preserve_relationship" }),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), rewrite);
  });
});

test("POST /api/rewrite rejects an empty message", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/rewrite`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "", analysis, goal: "preserve_relationship" }),
    });
    assert.equal(response.status, 400);
  });
});

test("POST /api/rewrite rejects an unsupported goal", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/rewrite`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "You never listen to me.", analysis, goal: "win_argument" }),
    });
    assert.equal(response.status, 400);
  });
});

test("POST /api/rewrite rejects a missing analysis", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/rewrite`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "You never listen to me.", goal: "preserve_relationship" }),
    });
    assert.equal(response.status, 400);
  });
});
