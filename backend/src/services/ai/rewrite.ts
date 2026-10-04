import type { Rewrite, RewriteInput, RewriteVersion } from "../../types/rewrite.js";
import { RewriteValidationError } from "../../types/rewrite.js";
import type { GemmaRewriteClient } from "./gemma.js";

function isScore(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

function isVersion(value: unknown): value is RewriteVersion {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const version = value as Record<string, unknown>;
  return typeof version.message === "string" && version.message.trim().length > 0 && isScore(version.riskScore);
}

export function parseRewriteResponse(response: string): Rewrite {
  let value: unknown;
  try {
    value = JSON.parse(response);
  } catch {
    throw new RewriteValidationError("The AI returned malformed JSON.");
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) throw new RewriteValidationError();
  const rewrite = value as Record<string, unknown>;
  if (!isVersion(rewrite.calm) || !isVersion(rewrite.firm) || !isVersion(rewrite.direct)) throw new RewriteValidationError();

  return { calm: rewrite.calm, firm: rewrite.firm, direct: rewrite.direct };
}

export class RewriteService {
  constructor(private readonly gemma: GemmaRewriteClient) {}

  async rewrite(input: RewriteInput): Promise<Rewrite> {
    return parseRewriteResponse(await this.gemma.rewrite(input));
  }
}
