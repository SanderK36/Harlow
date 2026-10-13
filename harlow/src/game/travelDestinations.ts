import {
  isQuestActive,
  isQuestCompleted,
  type JobId,
  type QuestProgress,
  type StoryFlag,
} from "./quests";

export function travelDestinationIds(ctx: {
  momTalked: boolean;
  job: JobId | null;
  jobQuestTarget: JobId | null;
  quests: QuestProgress[];
  hasFlag: (flag: StoryFlag) => boolean;
  /** October day. Cemetery stays shut until Sunday the 3rd. */
  dayNumber?: number;
}) {
  const dayNumber = ctx.dayNumber ?? 2;
  return [
    "front-yard",
    "hospital",
    ...(ctx.momTalked ? ["diner", "motel"] : []),
    ...(ctx.momTalked && dayNumber >= 3 ? ["cementary"] : []),
    ...(ctx.hasFlag("rachelMet")
      || isQuestActive(ctx.quests, "down-to-the-station")
      || isQuestCompleted(ctx.quests, "down-to-the-station")
      ? ["police-station"]
      : []),
    // Seeing the light from the street does not open the pin.
    // It opens only while Light on the Hill is active, or after it is done.
    ...(isQuestActive(ctx.quests, "light-on-the-hill")
      || isQuestCompleted(ctx.quests, "light-on-the-hill")
      ? ["sanatorium"]
      : []),
    ...(ctx.jobQuestTarget === "needle-groove" || ctx.job === "needle-groove"
      ? ["needle-and-groove"]
      : []),
    ...(ctx.jobQuestTarget === "gas-station" || ctx.job === "gas-station"
      ? ["gas-station"]
      : []),
    ...(ctx.jobQuestTarget === "scrapyard" || ctx.job === "scrapyard"
      ? ["scrapyard"]
      : []),
  ];
}
