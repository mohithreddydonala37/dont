export interface Analysis {
  emotion: string;
  emotionIntensity: number;
  tone: string;
  intent: string;
  riskScore: number;
  triggers: string[];
  explanation: string;
}
