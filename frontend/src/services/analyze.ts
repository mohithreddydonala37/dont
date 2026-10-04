import type { Analysis } from "../types/analysis";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function isScore(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

function isAnalysis(value: unknown): value is Analysis {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const analysis = value as Record<string, unknown>;
  return typeof analysis.emotion === "string"
    && isScore(analysis.emotionIntensity)
    && typeof analysis.tone === "string"
    && typeof analysis.intent === "string"
    && isScore(analysis.riskScore)
    && Array.isArray(analysis.triggers)
    && analysis.triggers.every((trigger) => typeof trigger === "string")
    && typeof analysis.explanation === "string";
}

export async function analyzeMessage(message: string): Promise<Analysis> {
  let response: Response;
  try {
    response = await fetch(`${apiUrl}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
  } catch {
    throw new Error("Couldn’t reach the local analysis service. Check that the backend is running.");
  }

  const body = await response.json().catch(() => null) as Analysis | { error?: { message?: string } } | null;
  if (!response.ok) {
    const errorMessage = body && "error" in body ? body.error?.message : undefined;
    throw new Error(errorMessage ?? "Analysis could not be completed. Please try again.");
  }

  if (!isAnalysis(body)) {
    throw new Error("The analysis service returned an invalid response.");
  }

  return body;
}
