import type { SceneCharacter } from "./scene/types";
import type { StoryFlag } from "./quests";
import type { DayOfWeek } from "./types";

/** The first NPC whose hours, weekday, and flags match. Scenes can list several. */
export function findActiveCharacter(
  characters: SceneCharacter[] | undefined,
  ctx: {
    time: number;
    day: DayOfWeek;
    marleneActive: boolean;
    hasFlag: (flag: StoryFlag) => boolean;
  },
) {
  return characters?.find((character) => {
    if (character.name === "Marlene" && !ctx.marleneActive) {
      return false;
    }
    if (character.days && !character.days.includes(ctx.day)) {
      return false;
    }
    if (character.requiresFlags && !character.requiresFlags.every((flag) => ctx.hasFlag(flag))) {
      return false;
    }
    if (character.excludesFlags && character.excludesFlags.some((flag) => ctx.hasFlag(flag))) {
      return false;
    }

    return (
      (character.from === undefined || ctx.time >= character.from) &&
      (character.until === undefined || ctx.time < character.until)
    );
  });
}
