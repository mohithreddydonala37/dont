import assert from "node:assert/strict";
import test from "node:test";

import { AnalysisService } from "../services/ai/analyze.js";

test("POST /api/analyze returns validated analysis from Gemma", async () => {
  process.env.NODE_ENV = "test";
  const { createApp } = await import("../server.js");
  const service = new AnalysisService({
    analyze: async () => JSON.stringify({
      emotion: "frustration",
      emotionIntensity: 87,
      tone: "aggressive",
      intent: "express frustration",
      riskScore: 82,
      triggers: ["You never", "You always"],
      explanation: "Absolute language may increase the chance of escalation.",
    }),
  });
  const server = createApp(service).listen();

  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const response = await fetch(`http://127.0.0.1:${address.port}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "You never listen to me." }),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      emotion: "frustration",
      emotionIntensity: 87,
      tone: "aggressive",
      intent: "express frustration",
      riskScore: 82,
      triggers: ["You never", "You always"],
      explanation: "Absolute language may increase the chance of escalation.",
    });
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test("POST /api/analyze rejects an empty message", async () => {
  process.env.NODE_ENV = "test";
  const { createApp } = await import("../server.js");
  const server = createApp(new AnalysisService({ analyze: async () => "{}" })).listen();

  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const response = await fetch(`http://127.0.0.1:${address.port}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "" }),
    });
    assert.equal(response.status, 400);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test("OPTIONS /api/analyze allows the frontend JSON request", async () => {
  process.env.NODE_ENV = "test";
  const { createApp } = await import("../server.js");
  const server = createApp(new AnalysisService({ analyze: async () => "{}" })).listen();

  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const response = await fetch(`http://127.0.0.1:${address.port}/api/analyze`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
    });

    assert.equal(response.status, 204);
    assert.equal(response.headers.get("access-control-allow-origin"), "http://localhost:3000");
    assert.match(response.headers.get("access-control-allow-methods") ?? "", /POST/);
    assert.equal(response.headers.get("access-control-allow-headers"), "Content-Type");
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
