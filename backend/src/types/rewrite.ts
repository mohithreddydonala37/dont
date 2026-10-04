import type { Analysis } from "./analysis.js";

export const goals = [
  "solve_problem",
  "set_boundary",
  "preserve_relationship",
  "express_frustration",
  "end_conversation",
] as const;

export type Goal = typeof goals[number];

export type RewriteVersion = {
  message: string;
  riskScore: number;
};

export type Rewrite = {
  calm: RewriteVersion;
  firm: RewriteVersion;
  direct: RewriteVersion;
};

export type RewriteInput = {
  message: string;
  analysis: Analysis;
  goal: Goal;
};

export class RewriteValidationError extends Error {
  constructor(message = "The AI response did not match the expected rewrite format.") {
    super(message);
    this.name = "RewriteValidationError";
  }
}
