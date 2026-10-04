import type { Analysis } from "../types/analysis";
import type { Rewrite } from "../types/rewrite";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const isScore = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
function isVersion(value: unknown): value is Rewrite[keyof Rewrite] { if (!value || typeof value !== "object" || Array.isArray(value)) return false; const v = value as Record<string, unknown>; return typeof v.message === "string" && v.message.trim().length > 0 && isScore(v.riskScore); }
function isRewrite(value: unknown): value is Rewrite { if (!value || typeof value !== "object" || Array.isArray(value)) return false; const r = value as Record<string, unknown>; return isVersion(r.calm) && isVersion(r.firm) && isVersion(r.direct); }

export async function rewriteMessage(message: string, analysis: Analysis, goal: string): Promise<Rewrite> {
  try { const response = await fetch(`${apiUrl}/api/rewrite`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, analysis, goal }) }); const body = await response.json().catch(() => null); if (!response.ok || !isRewrite(body)) throw new Error(); return body; } catch { throw new Error("Couldn't generate your versions. Try again."); }
}
