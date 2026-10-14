import { daytimeFigureDue, isHomeScene, PHONE_SILENCE_MS } from "@/game/chapter1";
import { ethan, npc, type StoryEntry } from "@/game/story";
import { isExteriorScene } from "@/game/scene/travel";
import type { StoryFlag } from "@/game/quests";
import { isNightTime } from "@/game/utils";

/**
 * Chapter 1 slasher beats. None of them are required, and none of them
 * move trust. Light on the Hill and the boot print stay the only gates.
 */

export const STALKER_MAX = 3;
export const STALKER_GAP_MINUTES = 2 * 60;
/** The watcher is gone from 03:00 until 07:00. */
export const STALKER_QUIET_FROM = 3 * 60;
export const STALKER_QUIET_UNTIL = 7 * 60;

export const STALKER_FIGURE = "/images/ui/stalkerFigure.png";
/** Painted hood, used when the transparent figure file has not arrived. */
export const HOODED_FALLBACK = "/images/locations/sanatorium/sanatoriumMainFloorNightShadow.png";

export const STREET_STALKER_THOUGHT = "Him. Across the street. Not moving.";
export const STREET_STALKER_GONE = "Gone. Didn't even hear a car.";

export const SHEET_LINES = [
  "Somebody behind the sheets on the line.",
  "Just a sheet. Just the wind.",
  "There's no wind.",
] as const;

export const SHEET_LINE_MS = 2600;
export const SHEET_FROM = 8 * 60;
export const SHEET_UNTIL = 12 * 60;

export const LINDA_SHEET_LINES: StoryEntry[] = [
  npc("Linda", "Have you seen my good white sheet? The one off the line?"),
  ethan("No."),
  npc("Linda", "Funny. It was there last night."),
];

export const LOCK_JOKE = "Great. Now I check locks. I'm my mother.";
export const MARGARET_DEADBOLT =
  "You hear about the Elrod place? Half the street's buying deadbolts. Hardware store's never had a better week.";
export const EARL_TOWEL = "Room 6 asked for extra towels. Didn't say why. I didn't ask.";

export const MILLER_OPEN = 7 * 60;
export const MILLER_CLOSE = 18 * 60;
export const MILLER_DARK = "Not after dark. Not out there.";
export const MILLER_ARRIVAL = "Miller Lake. Dad and Walter's spot. Nobody fishes here anymore.";
export const MILLER_CAMP = "CAMP PINEWOOD. Closed since '72. Of course it is.";
export const MILLER_CABIN = "Somebody's been sleeping here. Blanket's still warm.";
export const MILLER_DOCK = "Something under the dock. I'm not checking.";
export const MILLER_CHECK = "...I'm checking.";
export const MILLER_BOOK = "Her algebra book. Her name inside. It's dry. Ten years, and it's dry.";
export const MILLER_RECENT = "Somebody put this here. Recently.";
export const BOOK_WOODS_THOUGHT = "Same road. Same woods. He keeps bringing me back here.";

export const NAME_WHISPER_THOUGHT = "He knows my name.";
export const NIGHT_WHISPER_NAME = "...Ethan.";

export const TIMED_CHOICE_MS = 6000;
export const TIMED_CHOICE_STEPS = 6;
export const TIMED_CHOICE_BUTTON_MIN_PX = 44;

export const HIDE_LINES = [
  "Footsteps. Slow. Stopping right outside.",
  "Breathing. Same as the phone.",
  "Then nothing.",
] as const;
export const HIDE_LINE_MS = 2800;
export const HIDE_BLACK_MS = 2000;
export const HIDE_REOPEN_MS = 800;

export const RUN_LINES = [
  "Don't look back. Don't look back.",
  "I looked back.",
] as const;
export const RUN_LINE_MS = 2200;
export const RUN_FIGURE_MS = 300;
export const RUN_BLACK_MS = 700;

const EXTRA_OUTDOOR = new Set([
  "back-yard",
  "street",
  "light-pole",
  "cementary-backside",
  "elrod-house",
  "elrod-backyard",
  "miller-camp",
  "miller-dock",
]);

export function isSanatoriumScene(sceneId: string) {
  return sceneId === "sanatorium" || sceneId.startsWith("sanatorium-");
}

/** Outdoors, and never the sanatorium. Yards and the Elrod place count. */
export function stalkerOutdoors(sceneId: string) {
  if (isSanatoriumScene(sceneId)) return false;
  return isExteriorScene(sceneId) || EXTRA_OUTDOOR.has(sceneId);
}

/** Indoor to outdoor. The sanatorium road does not count as going outside. */
export function wentOutside(fromScene: string, toScene: string) {
  return !stalkerOutdoors(fromScene) && stalkerOutdoors(toScene);
}

export function stalkerMinute(dayNumber: number, time: number) {
  return dayNumber * 1440 + time;
}

/** Saturday (day 1, dayNumber 2) and Sunday (day 2, dayNumber 3) only. */
export function isStalkerDay(dayNumber: number) {
  return dayNumber === 2 || dayNumber === 3;
}

export function stalkerHoursOpen(time: number) {
  return time < STALKER_QUIET_FROM || time >= STALKER_QUIET_UNTIL;
}

export function stalkerGapOpen(lastAt: number | null, dayNumber: number, time: number) {
  if (lastAt == null) return true;
  return stalkerMinute(dayNumber, time) - lastAt >= STALKER_GAP_MINUTES;
}

export type StalkerContext = {
  sceneId: string;
  dayNumber: number;
  time: number;
  sightings: number;
  lastAt: number | null;
  inConversation: boolean;
};

export function stalkerAllowed(input: StalkerContext) {
  if (input.inConversation) return false;
  if (!isStalkerDay(input.dayNumber)) return false;
  if (!stalkerHoursOpen(input.time)) return false;
  if (input.sightings >= STALKER_MAX) return false;
  if (!stalkerOutdoors(input.sceneId)) return false;
  return stalkerGapOpen(input.lastAt, input.dayNumber, input.time);
}

/**
 * Sighting 1. The first time he steps outside after The Gate has started.
 * "Across the street" is that arrival, not a later walk between outdoor scenes.
 */
export function streetStalkerDue(input: StalkerContext & {
  fromScene: string;
  gateStarted: boolean;
  seen: boolean;
}) {
  if (input.seen || !input.gateStarted) return false;
  if (!wentOutside(input.fromScene, input.sceneId)) return false;
  return stalkerAllowed(input);
}

/** Sighting 2. Sunday morning, the neighbour's line, from the street. */
export function sheetStalkerDue(input: StalkerContext & { seen: boolean }) {
  if (input.seen) return false;
  if (input.sceneId !== "street") return false;
  if (input.dayNumber !== 3) return false;
  if (input.time < SHEET_FROM || input.time >= SHEET_UNTIL) return false;
  return stalkerAllowed(input);
}

/**
 * Sighting 3 is the existing Elrod-woods beat. On Sunday it waits out the
 * two-hour gap and spends a sighting. A later day still shows him, and
 * does not add to the counter.
 */
export function woodsFigureDue(input: StalkerContext & {
  bootPrintSeen: boolean;
  seen: boolean;
}) {
  if (input.inConversation) return false;
  if (!daytimeFigureDue({
    sceneId: input.sceneId,
    dayNumber: input.dayNumber,
    time: input.time,
    bootPrintSeen: input.bootPrintSeen,
    seen: input.seen,
  })) return false;
  if (input.dayNumber === 3) return stalkerAllowed(input);
  return true;
}

export function woodsSightingCounts(input: StalkerContext & {
  bootPrintSeen: boolean;
  seen: boolean;
}) {
  return input.dayNumber === 3 && woodsFigureDue(input);
}

export function nextStalkerCount(sightings: number) {
  return Math.min(STALKER_MAX, Math.max(0, Math.trunc(sightings)) + 1);
}

export function restoredStalkerCount(
  stored: number | undefined,
  flags: Partial<Record<StoryFlag, boolean>>,
) {
  if (typeof stored === "number" && Number.isFinite(stored)) {
    return Math.max(0, Math.min(STALKER_MAX, Math.trunc(stored)));
  }
  const fromFlags = Number(Boolean(flags.streetStalkerSeen))
    + Number(Boolean(flags.sheetStalkerSeen))
    + Number(Boolean(flags.daytimeFigureSeen));
  return Math.min(STALKER_MAX, fromFlags);
}

/** Sunday after noon, in the kitchen, only once the sheet sighting happened. */
export function lindaSheetDue(input: {
  sceneId: string;
  dayNumber: number;
  time: number;
  sheetSeen: boolean;
  heard: boolean;
}) {
  return (
    input.sceneId === "kitchen"
    && input.dayNumber === 3
    && input.time >= 12 * 60
    && input.sheetSeen
    && !input.heard
  );
}

export function millerLakeUnlocked(input: { has1966: boolean; oldFriendsDone: boolean }) {
  return input.has1966 || input.oldFriendsDone;
}

export function millerClosed(time: number) {
  return time < MILLER_OPEN || time >= MILLER_CLOSE;
}

/** Closed now, or the walk would arrive after dark. */
export function millerTripClosed(time: number, travelMinutes: number) {
  if (millerClosed(time)) return true;
  const arrive = time + Math.max(0, travelMinutes);
  if (arrive >= 1440) return true;
  return millerClosed(arrive);
}

/**
 * Night 2. He answered the first call, then comes home after 20:00 on Sunday.
 * Already being home does not ring it. Leaving and coming back does, once.
 */
export function nightWhisperDue(input: {
  answered: boolean;
  heard: boolean;
  dayNumber: number;
  time: number;
  fromScene: string;
  toScene: string;
}) {
  if (!input.answered || input.heard) return false;
  if (input.dayNumber !== 3 || input.time < 20 * 60) return false;
  return isHomeScene(input.toScene) && !isHomeScene(input.fromScene);
}

export const NIGHT_WHISPER_LINES: StoryEntry[] = [
  { type: "narration", text: "Breathing.", pauseAfter: 2200 },
  { type: "narration", text: NIGHT_WHISPER_NAME, pauseAfter: 1600, whisper: true },
  { type: "narration", text: "Click.", pauseAfter: PHONE_SILENCE_MS },
];

export function margaretDeadboltDue(input: { dayNumber: number; heard: boolean }) {
  return input.dayNumber === 3 && !input.heard;
}

export function earlTowelDue(input: {
  dayNumber: number;
  room6Heard: boolean;
  heard: boolean;
}) {
  return input.dayNumber === 3 && input.room6Heard && !input.heard;
}

export function timedChoiceEnabled(timedChoices: boolean) {
  return timedChoices;
}

/** No answer before the bar finishes. The only timed choice defaults to Hide. */
export function unansweredEscape(): "hide" {
  return "hide";
}

export type EscapeStep = {
  id: string;
  text: string | null;
  ms: number;
  strip: "open" | "shut";
  shake: boolean;
  figure: boolean;
  black: boolean;
};

export function escapeSteps(choice: "hide" | "run", reducedMotion: boolean): EscapeStep[] {
  if (choice === "hide") {
    return [
      ...HIDE_LINES.map((text, index) => ({
        id: `hide-${index}`,
        text,
        ms: HIDE_LINE_MS,
        strip: "open" as const,
        shake: false,
        figure: false,
        black: false,
      })),
      {
        id: "hide-black",
        text: null,
        ms: HIDE_BLACK_MS,
        strip: "shut",
        shake: false,
        figure: false,
        black: true,
      },
      {
        id: "hide-open",
        text: null,
        ms: HIDE_REOPEN_MS,
        strip: "open",
        shake: false,
        figure: false,
        black: false,
      },
    ];
  }
  return [
    {
      id: "run-0",
      text: RUN_LINES[0],
      ms: RUN_LINE_MS,
      strip: "shut",
      shake: !reducedMotion,
      figure: false,
      black: false,
    },
    {
      id: "run-1",
      text: RUN_LINES[1],
      ms: RUN_LINE_MS,
      strip: "shut",
      shake: false,
      figure: false,
      black: false,
    },
    {
      id: "run-figure",
      text: null,
      ms: RUN_FIGURE_MS,
      strip: "shut",
      shake: false,
      figure: true,
      black: false,
    },
    {
      id: "run-black",
      text: null,
      ms: RUN_BLACK_MS,
      strip: "shut",
      shake: false,
      figure: false,
      black: true,
    },
  ];
}

export function emilyGraveStoneImage(weather: string, time: number) {
  if (isNightTime(time)) return "./images/locations/cemetery/emilyGraveStoneNight.png";
  if (weather === "Thunderstorm") return "./images/locations/cemetery/emilyGraveStoneThunder.png";
  if (weather === "Rainy" || weather === "Heavy rain") {
    return "./images/locations/cemetery/emilyGraveStoneRainy.png";
  }
  return "./images/locations/cemetery/emilyGraveStoneSunny.png";
}

export function elrodShadowPlate(weather: string, time: number) {
  if (isNightTime(time)) {
    return "./images/locations/neighbourhood/elrodHouse/elrodHouseBackyardNightShadowInWood.png";
  }
  if (weather === "Thunderstorm") {
    return "./images/locations/neighbourhood/elrodHouse/elrodHouseBackyardThunderShadowInWood.png";
  }
  if (weather === "Rainy" || weather === "Heavy rain") {
    return "./images/locations/neighbourhood/elrodHouse/elrodHouseBackyardRainyShadowInWood.png";
  }
  return "./images/locations/neighbourhood/elrodHouse/elrodHouseBackyardDayShadowInWood.png";
}

export const WALTER_AT_STONE = "./images/misc/walterAtEmilyGrave.png";

/** Plates the lake still needs. Existing art stands in until they arrive. */
export const MILLER_PLATES = {
  shore: "./images/locations/millerLake/millerLakeSunny.png",
  shoreNight: "./images/locations/millerLake/millerLakeNight.png",
  shoreRain: "./images/locations/millerLake/millerLakeRainy.png",
  shoreThunder: "./images/locations/millerLake/millerLakeThunder.png",
  camp: "./images/locations/millerLake/millerCamp.png",
  cabin: "./images/locations/millerLake/millerCabin.png",
  dock: "./images/locations/millerLake/millerDock.png",
  tackle: "./images/locations/millerLake/millerTackle.png",
  book: "/images/misc/algebraBook.png",
} as const;

export const MILLER_FALLBACK = {
  shore: "./images/misc/flashbackEthanPovForest.png",
  camp: "./images/misc/flashbackEthanPovForest.png",
  cabin: "./images/locations/sanatorium/sanatoriumRoom1Day.png",
  dock: "./images/locations/cemetery/cemeteryBacksideDay.png",
  tackle: "./images/misc/oldPhotoWalterFishing.png",
} as const;
