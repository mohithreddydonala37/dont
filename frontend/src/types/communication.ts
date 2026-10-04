export type Goal = { id: string; emoji: string; label: string; description: string };

export const goals: Goal[] = [
  { id: "solve_problem", emoji: "\u{1F4AC}", label: "Solve the problem", description: "I want to resolve the situation." },
  { id: "set_boundary", emoji: "\u{1F6D1}", label: "Set a boundary", description: "I want to be clear about what I will and won't accept." },
  { id: "preserve_relationship", emoji: "\u{1F91D}", label: "Preserve the relationship", description: "I want to communicate clearly without unnecessarily damaging the relationship." },
  { id: "express_frustration", emoji: "\u{1F610}", label: "Express frustration", description: "I want to honestly communicate how frustrated I am." },
  { id: "end_conversation", emoji: "\u{2702}\u{FE0F}", label: "End the conversation", description: "I want to end this conversation clearly and respectfully." },
];
