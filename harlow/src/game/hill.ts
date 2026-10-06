import {
  isQuestActive,
  isQuestCompleted,
  type QuestProgress,
  type StoryFlag,
} from "@/game/quests";

export const HILL_THOUGHT = "There's a light up on the hill. Nobody goes up there.";

/** Night in the front yard, once both prerequisite quests are done. */
export function shouldNoticeHill(
  sceneId: string,
  time: number,
  questList: QuestProgress[],
  flags: Partial<Record<StoryFlag, boolean>>,
) {
  const night = time >= 1080 || time < 360;
  return (
    sceneId === "front-yard"
    && night
    && isQuestCompleted(questList, "what-walter-said")
    && isQuestCompleted(questList, "faded-poster")
    && !flags.sanatoriumSeenFromStreet
    && !isQuestActive(questList, "light-on-the-hill")
    && !isQuestCompleted(questList, "light-on-the-hill")
  );
}

/**
 * Time that passes on the way somewhere is noticed at the destination.
 * A wait (no destination, or the same scene) is noticed where Ethan already is.
 * Walking off the yard at 17:55 must not treat 18:20 as a night spent in the yard.
 */
export function hillCheckScene(currentSceneId: string, destinationSceneId?: string | null) {
  if (destinationSceneId && destinationSceneId !== currentSceneId) return destinationSceneId;
  return currentSceneId;
}
