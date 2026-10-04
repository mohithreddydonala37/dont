import assert from "node:assert/strict";
import test from "node:test";

import { parseRewriteResponse } from "./rewrite.js";

const validRewrite = {
  calm: { message: "I feel unheard, and I would like us to discuss this when we can listen to each other.", riskScore: 24 },
  firm: { message: "I need to feel heard in this conversation. Let's return to it when we can both engage respectfully.", riskScore: 33 },
  direct: { message: "I feel unheard. I need to pause this conversation for now.", riskScore: 28 },
};

test("parses a complete structured Gemma rewrite", () => {
  assert.deepEqual(parseRewriteResponse(JSON.stringify(validRewrite)), validRewrite);
});

test("rejects malformed Gemma rewrite JSON", () => {
  assert.throws(() => parseRewriteResponse("not json"));
});

test("rejects a rewrite with a missing version", () => {
  assert.throws(() => parseRewriteResponse(JSON.stringify({ calm: validRewrite.calm, firm: validRewrite.firm })));
});

test("rejects a rewrite risk score outside 0-100", () => {
  assert.throws(() => parseRewriteResponse(JSON.stringify({
    ...validRewrite,
    direct: { ...validRewrite.direct, riskScore: 101 },
  })));
});

test("rejects an empty generated rewrite message", () => {
  assert.throws(() => parseRewriteResponse(JSON.stringify({
    ...validRewrite,
    calm: { ...validRewrite.calm, message: "   " },
  })));
});
