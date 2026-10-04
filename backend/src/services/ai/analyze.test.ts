import assert from "node:assert/strict";
import test from "node:test";

import { parseAnalysisResponse } from "./analyze.js";

test("parses a valid structured Gemma analysis", () => {
  const result = parseAnalysisResponse(JSON.stringify({
    emotion: "frustration",
    emotionIntensity: 87,
    tone: "aggressive",
    intent: "express frustration",
    riskScore: 82,
    triggers: ["You never", "You always"],
    explanation: "Absolute language may make the conversation escalate.",
  }));

  assert.equal(result.riskScore, 82);
  assert.deepEqual(result.triggers, ["You never", "You always"]);
});

test("rejects malformed and out-of-range Gemma analysis", () => {
  assert.throws(() => parseAnalysisResponse("not json"));
  assert.throws(() => parseAnalysisResponse(JSON.stringify({
    emotion: "frustration",
    emotionIntensity: 101,
    tone: "aggressive",
    intent: "express frustration",
    riskScore: 82,
    triggers: [],
    explanation: "Example",
  })));
});
