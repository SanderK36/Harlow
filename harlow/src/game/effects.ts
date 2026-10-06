import type { Player } from "./types";
import type { ChoiceEffects } from "./choices";
import type { StoryEntry } from "./story";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function applyEffects(
  player: Player,
  effects: ChoiceEffects
): Player {
  return {
    ...player,

    courage: player.courage + (effects.courage ?? 0),
    intelligence: player.intelligence + (effects.intelligence ?? 0),
    charisma: player.charisma + (effects.charisma ?? 0),
    athletics: player.athletics + (effects.athletics ?? 0),
    strength: player.strength + (effects.strength ?? 0),

    health: clamp(
      player.health + (effects.health ?? 0),
      0,
      player.maxHealth
    ),
    stamina: clamp(
      player.stamina + (effects.stamina ?? 0),
      0,
      player.maxStamina
    ),
    fear: Math.max(0, player.fear + (effects.fear ?? 0)),
    money: clamp(player.money + (effects.money ?? 0), 0, Infinity),
  };
}

/** A night's sleep fills stamina and health. Other stats stay as they were. */
export function restAfterSleep(player: Player): Player {
  return {
    ...player,
    health: player.maxHealth,
    stamina: player.maxStamina,
  };
}

export function effectsToStory(effects: ChoiceEffects): StoryEntry[] {
  return Object.entries(effects).map(
    ([stat, amount]) => ({
      type: "effect",
      stat: stat as
        | "health"
        | "stamina"
        | "fear"
        | "money"
        | "courage",
      amount: amount as number,
    })
  );
}
