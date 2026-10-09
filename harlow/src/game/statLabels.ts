import type { ChoiceEffects } from "./choices";

const STAT_LABELS: Record<keyof ChoiceEffects, string> = {
  health: "HP",
  stamina: "STAM",
  fear: "FEAR",
  money: "$",
  courage: "COURAGE",
  intelligence: "INTELLIGENCE",
  charisma: "CHARISMA",
  athletics: "ATHLETICS",
  strength: "STRENGTH",
};

/** Short in-world notice, using the same names as the side panel. */
export function formatStatDelta(stat: string, amount: number) {
  const sign = amount > 0 ? "+" : amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  if (stat === "money") return `${sign}$${abs}`;
  const label = STAT_LABELS[stat as keyof ChoiceEffects] ?? stat.toUpperCase();
  return `${sign}${abs} ${label}`;
}

/**
 * What a choice button can promise before it is taken.
 * Minutes belong on the town map only. Scene buttons keep stat changes.
 */
export function choiceAffordance(
  choice: {
    effects?: ChoiceEffects;
    timeCost?: number;
  },
  options?: { showTime?: boolean },
) {
  const parts: string[] = [];
  if (choice.effects) {
    for (const [stat, amount] of Object.entries(choice.effects)) {
      if (typeof amount === "number" && amount !== 0) {
        parts.push(formatStatDelta(stat, amount));
      }
    }
  }
  if (options?.showTime && choice.timeCost && choice.timeCost > 0) {
    parts.push(`${choice.timeCost} min`);
  }
  return parts.join(" · ");
}
