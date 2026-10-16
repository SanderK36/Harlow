import { findActiveCharacter } from "./activeCharacter";
import { folderLook, rachelDrawn } from "./chapter1";
import { atticHotspotVisible, bootPrintHotspotHidden, gazetteOnPorch } from "./clues";
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
import { scenes } from "./scenes";
import type { GameState } from "./types";
import { isNightTime } from "./utils";

/** Talk actions follow the NPC standing in the scene, not a second clock. */
const NPC_FOR_TALK: Record<string, string> = {
  talkToMom: "Linda",
  talkToJohnny: "Johnny Dalton",
  talkToWalter: "Walter Harrington",
  talkToWalterAtStone: "Walter Harrington",
  talkToMargaret: "Margaret Sullivan",
  talkToEarl: "Earl",
  talkToBigRoy: "Big Roy",
  talkToRay: "Ray Mercer",
  talkToTommy: "Tommy Vance",
  talkToMarlene: "Marlene",
};

function npcIsHere(name: string, ctx: ChoiceContext) {
  const scene = scenes[ctx.currentSceneId as keyof typeof scenes];
  return findActiveCharacter(scene?.characters, {
    time: ctx.gameState.time,
    day: ctx.gameState.dayOfWeek,
    dayNumber: ctx.gameState.dayNumber,
    marleneActive: ctx.marleneActive,
    hasFlag: ctx.hasFlag,
  })?.name === name;
}

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

  if (
    action !== "lookAtGazette"
    && !ctx.momTalked
    && (choice.travel || ["front-yard", "back-yard", "light-pole"].includes(choice.nextScene))
  ) {
    return false;
  }
  if (!ctx.momTalked && action === "relaxOnCouch") return false;
  if (!ctx.momTalked && sceneId === "front-yard") {
    if (action === "lookAtGazette") {
      return gazetteOnPorch(dayOfWeek, time, ctx.hasFlag("gazetteFound"));
    }
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

  if (NPC_FOR_TALK[action]) return npcIsHere(NPC_FOR_TALK[action], ctx);
  if (action === "workNeedleGrooveShift") {
    return ctx.job === "needle-groove" && time >= 600 && time < 1140;
  }
  if (action === "lookAtEmilyStone") {
    return sceneId === "cementary-inside" && ctx.gameState.dayNumber >= 3 && !ctx.hasFlag("emilyStoneSeen");
  }
  if (action === "lookAtRoom6") return ctx.hasFlag("room6Heard");
  if (action === "lookAtEmilyFolder") {
    const look = folderLook({
      time,
      fileDrawerSeen: ctx.storyFlags.fileDrawerSeen,
      emilyFileOpened: ctx.storyFlags.emilyFileOpened,
      folderLockedToday: ctx.storyFlags.folderLockedToday,
      rachelFolderCover: ctx.storyFlags.rachelFolderCover,
    });
    return look === "open" || look === "caught";
  }
  if (action === "openShop") return time >= 540 && time < 1380;
  if (action === "goToMarleneCounter") return !ctx.marleneActive;
  if (action === "leaveMarleneCounter") return ctx.marleneActive;
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
    // Elrod: 07:00–18:00, and only while she is actually on the porch.
    if (sceneId !== "elrod-house") return false;
    return rachelDrawn({
      time,
      rachelMet: ctx.hasFlag("rachelMet"),
      walterStationTalk: ctx.hasFlag("walterStationTalk"),
      quests: ctx.quests,
    });
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
  if (action === "lookAtElrodBootPrint") {
    const told =
      ctx.hasFlag("margaretGossipHeard") || ctx.hasFlag("hillPrintHint");
    return told && !bootPrintHotspotHidden(time);
  }
  if (action === "lookInDadsBox") return atticHotspotVisible(ctx.storyFlags);
  if (
    action === "lookAtEmilyMusicBox"
    || action === "lookAtEmilyPolaroid"
    || action === "lookAtEmilyNote"
  ) {
    return ctx.momTalked;
  }
  if (action === "lookAtGazette") {
    return gazetteOnPorch(dayOfWeek, time, ctx.hasFlag("gazetteFound"));
  }

  if (choice.requirements?.flags && !ctx.hasAllFlags(choice.requirements.flags)) return false;
  if (choice.requirements?.excludesFlags && ctx.hasAnyFlag(choice.requirements.excludesFlags)) return false;
  if (choice.requirements?.item && !ctx.inventory.includes(choice.requirements.item)) return false;

  return true;
}
