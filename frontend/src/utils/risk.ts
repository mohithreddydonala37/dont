export function getRiskLabel(score: number): string {
  if (score <= 29) return "LOW RISK";
  if (score <= 59) return "MODERATE RISK";
  if (score <= 79) return "HIGH RISK";
  return "VERY HIGH RISK";
}
