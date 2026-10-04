import type { Goal } from "../../types/communication";

type Props = { goals: Goal[]; selectedGoal: string; onSelect: (goalId: string) => void; disabled?: boolean };

export function GoalSelector({ goals, selectedGoal, onSelect, disabled = false }: Props) {
  return <section className="goal-section reveal" aria-labelledby="goal-heading"><p className="eyebrow">Choose your north star</p><h2 id="goal-heading">What do you actually want to achieve?</h2><div className="goal-options" aria-label="Communication goal" aria-busy={disabled}>{goals.map((goal) => <button aria-pressed={selectedGoal === goal.id} className={`goal-option ${selectedGoal === goal.id ? "is-selected" : ""}`} disabled={disabled} key={goal.id} onClick={() => onSelect(goal.id)} type="button"><span aria-hidden="true">{goal.emoji}</span><span><strong>{goal.label}</strong><small>{goal.description}</small></span></button>)}</div></section>;
}
