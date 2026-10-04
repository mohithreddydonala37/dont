export interface Analysis {
  emotion: string;
  emotionIntensity: number;
  tone: string;
  intent: string;
  riskScore: number;
  triggers: string[];
  explanation: string;
}

export class AnalysisValidationError extends Error {
  constructor(message = "The AI response did not match the expected analysis format.") {
    super(message);
    this.name = "AnalysisValidationError";
  }
}
