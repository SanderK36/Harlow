import type { Choice } from "./choices";
import { TIRED_END } from "./lateNight";
import {
  coffeeErrandOpen,
  isQuestActive,
  isQuestCompleted,
  type JobId,
  type QuestProgress,
  type StoryFlag,
} from "./quests";
import type { GameState } from "./types";
import { isNightTime } from "./utils";

const BEDTIME_START = 1320;

export type ChoiceContext = {
  gameState: GameState;
  currentSceneId: string;
  momTalked: boolean;
  job: JobId | null;
  jobQuestTarget: JobId | null;
  quests: QuestProgress[];
  marleneActive: boolean;
  deskCigarettesPickedUp: boolean;
  scrapyardKnifePickedUp: boolean;
  garageFlashlightPickedUp: boolean;
  inventory: string[];
  storyFlags: Partial<Record<StoryFlag, boolean>>;
  hasFlag: (flag: StoryFlag) => boolean;
  hasAllFlags: (flags: StoryFlag[] | StoryFlag | undefined) => boolean;
  hasAnyFlag: (flags: StoryFlag[] | StoryFlag | undefined) => boolean;
};

export function isChoiceAvailable(choice: Choice, ctx: ChoiceContext) {
  // Temporary availability rules for story moments. Keep rules keyed by action
  // names, or move them into a richer `requirements` type as the game grows.
  const { action } = choice;
  const { time, dayOfWeek } = ctx.gameState;
  const { currentSceneId: sceneId } = ctx;

  if (choice.excludesStoryFlag && ctx.hasAnyFlag(choice.excludesStoryFlag)) return false;
  if (action === "makeCoffee" && coffeeErrandOpen(ctx.storyFlags)) return false;

  if (!ctx.momTalked && (choice.travel || ["front-yard", "back-yard", "light-pole"].includes(choice.nextScene))) {
    return false;
  }
  if (!ctx.momTalked && action === "relaxOnCouch") return false;
  if (!ctx.momTalked && sceneId === "front-yard") {
    return ["enterGarage", "goBackYard", "goToStreets", "goHome"].includes(action);
  }
  if (action === "goToSleep") {
    return sceneId === "ethan-room" && (time >= BEDTIME_START || time < TIRED_END);
  }
  if (action === "goToStreets") {
    return sceneId === "front-yard";
  }
  if (action === "watchTv") {
    return sceneId === "living-room";
  }

  if (action === "talkToMom") {
    const weekend = dayOfWeek === "Saturday" || dayOfWeek === "Sunday";
    if (sceneId === "kitchen") {
      return (time >= 450 && time < 540)
        || (weekend && time >= 720 && time < 1140);
    }
    if (sceneId === "living-room") {
      return weekend
        ? time >= 540 && time < 1320
        : time >= 540 && time < 1080;
    }
    return false;
  }
  if (action === "talkToJohnny") return time >= 480 && time < 840;
  if (action === "workNeedleGrooveShift") {
    return ctx.job === "needle-groove" && time >= 600 && time < 1140;
  }
  if (action === "talkToWalter") return time >= 480 && time < 960;
  if (action === "talkToMargaret") return time >= 420 && time < 900;
  if (action === "talkToEarl") return time >= 480 && time < 1020;
  if (action === "talkToBigRoy") return time >= 420 && time < 900;
  if (action === "talkToRay") return time >= 540 && time < 1380;
  if (action === "talkToTommy") return time >= 480 && time < 1020;
  if (action === "openShop") return time >= 540 && time < 1380;
  if (action === "goToMarleneCounter") return !ctx.marleneActive;
  if (action === "talkToMarlene" || action === "leaveMarleneCounter") return ctx.marleneActive;
  if (ctx.marleneActive && (action === "leaveHospital" || action === "goToHospitalRoom")) return false;
  if (action === "pickUpCigarettes") return !ctx.deskCigarettesPickedUp;
  // Roy works in the scrapyard from 07:00 to 15:00, so Ethan cannot
  // quietly take the knife while he is nearby.
  if (action === "takeScrapyardKnife") {
    return !ctx.scrapyardKnifePickedUp && (time < 420 || time >= 900);
  }
  if (action === "pickUpGarageFlashlight") return !ctx.garageFlashlightPickedUp;
  if (action.startsWith("choose") && action.endsWith("Job")) {
    // The flyers are the job quest. Hearing Mom worry is not enough.
    return (
      !ctx.job
      && !ctx.jobQuestTarget
      && (isQuestActive(ctx.quests, "find-a-job") || ctx.hasFlag("willHelpMom"))
    );
  }

  if (action === "goElrodHouse") {
    return ctx.momTalked && (
      isQuestActive(ctx.quests, "the-tape")
      || ctx.hasFlag("rachelMet")
      || isQuestCompleted(ctx.quests, "the-tape")
    );
  }
  if (action === "talkToRachel") {
    // Elrod: Rachel is only out 07:00–19:00 (matches her standing art).
    if (sceneId === "elrod-house") {
      return !ctx.hasFlag("rachelMet") && time >= 420 && time < 1140;
    }
    // Front yard follow-up: 07:00–21:00.
    if (sceneId === "front-yard") {
      return (
        ctx.hasFlag("walterStationTalk")
        && isQuestActive(ctx.quests, "what-walter-said")
        && time >= 420
        && time < 1260
      );
    }
    return false;
  }
  if (action === "lookAtSanatoriumHill") {
    const night = time >= 1080 || time < 360;
    // Hidden until the night line has started the quest. The button itself
    // says there is something on the hill.
    return (
      night
      && (
        isQuestActive(ctx.quests, "light-on-the-hill")
        || isQuestCompleted(ctx.quests, "light-on-the-hill")
      )
      && !ctx.hasFlag("sanatoriumSeenFromStreet")
    );
  }
  if (action === "lookAtDinerBulletin") {
    // Board is inspectable once the diner is in play; finding the poster
    // can start Faded Poster even before Linda's coffee errand.
    return ctx.momTalked && !ctx.hasFlag("posterFound");
  }
  if (action === "lookAtSanatoriumCigarette") {
    return isNightTime(time) && !ctx.hasFlag("sanatoriumCigaretteSeen");
  }
  if (action === "lookAtElrodTape") return true;

  if (choice.requirements?.flags && !ctx.hasAllFlags(choice.requirements.flags)) return false;
  if (choice.requirements?.excludesFlags && ctx.hasAnyFlag(choice.requirements.excludesFlags)) return false;
  if (choice.requirements?.item && !ctx.inventory.includes(choice.requirements.item)) return false;

  return true;
}
