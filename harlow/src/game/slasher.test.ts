import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { connectionStartsOldFriends, endingAfterEscape, endingFrames, LET_GO_THOUGHT } from "./chapter1.ts";
import { CLUE_CONNECTIONS, CLUE_DEFS } from "./clues.ts";
import {
  BOOK_WOODS_THOUGHT,
  EARL_TOWEL,
  escapeSteps,
  HIDE_BLACK_MS,
  HIDE_LINES,
  HOODED_FALLBACK,
  LINDA_SHEET_LINES,
  LOCK_JOKE,
  MARGARET_DEADBOLT,
  MILLER_ARRIVAL,
  MILLER_BOOK,
  MILLER_CABIN,
  MILLER_CAMP,
  MILLER_CHECK,
  MILLER_DOCK,
  MILLER_FALLBACK,
  MILLER_PLATES,
  MILLER_RECENT,
  NAME_WHISPER_THOUGHT,
  NIGHT_WHISPER_LINES,
  NIGHT_WHISPER_NAME,
  RUN_FIGURE_MS,
  RUN_LINES,
  SHEET_LINES,
  STALKER_FIGURE,
  STALKER_MAX,
  STREET_STALKER_GONE,
  STREET_STALKER_THOUGHT,
  WALTER_AT_STONE,
  TIMED_CHOICE_BUTTON_MIN_PX,
  TIMED_CHOICE_MS,
  TIMED_CHOICE_STEPS,
  earlTowelDue,
  elrodShadowPlate,
  emilyGraveStoneImage,
  lindaSheetDue,
  margaretDeadboltDue,
  millerClosed,
  millerLakeUnlocked,
  millerTripClosed,
  nextStalkerCount,
  nightWhisperDue,
  restoredStalkerCount,
  sheetStalkerDue,
  stalkerAllowed,
  streetStalkerDue,
  timedChoiceEnabled,
  unansweredEscape,
  wentOutside,
  woodsFigureDue,
  woodsSightingCounts,
  type StalkerContext,
} from "./slasher.ts";

const quiet: StalkerContext = {
  sceneId: "street",
  dayNumber: 2,
  time: 10 * 60,
  sightings: 0,
  lastAt: null,
  inConversation: false,
};

describe("the watcher", () => {
  it("stays outdoors, on day 1 and 2, outside 03:00–07:00, and two hours apart", () => {
    assert.equal(stalkerAllowed(quiet), true);
    assert.equal(stalkerAllowed({ ...quiet, sceneId: "kitchen" }), false);
    assert.equal(stalkerAllowed({ ...quiet, sceneId: "sanatorium" }), false);
    assert.equal(stalkerAllowed({ ...quiet, sceneId: "sanatorium-entrance" }), false);
    assert.equal(stalkerAllowed({ ...quiet, inConversation: true }), false);
    assert.equal(stalkerAllowed({ ...quiet, dayNumber: 4 }), false);
    assert.equal(stalkerAllowed({ ...quiet, dayNumber: 3 }), true);
    assert.equal(stalkerAllowed({ ...quiet, time: 3 * 60 }), false);
    assert.equal(stalkerAllowed({ ...quiet, time: 7 * 60 - 1 }), false);
    assert.equal(stalkerAllowed({ ...quiet, time: 7 * 60 }), true);
    assert.equal(stalkerAllowed({ ...quiet, time: 2 * 60 }), true);
    assert.equal(stalkerAllowed({ ...quiet, sightings: STALKER_MAX }), false);
    const at = 2 * 1440 + 10 * 60;
    assert.equal(stalkerAllowed({ ...quiet, lastAt: at, time: 11 * 60 }), false);
    assert.equal(stalkerAllowed({ ...quiet, lastAt: at, time: 12 * 60 }), true);
    assert.equal(wentOutside("diner-inside", "diner"), true);
    assert.equal(wentOutside("street", "elrod-house"), false);
    assert.equal(wentOutside("hallway", "sanatorium"), false);
  });

  it("puts the first sighting on the first step outside after The Gate", () => {
    const due = {
      ...quiet,
      fromScene: "diner-inside",
      sceneId: "diner",
      gateStarted: true,
      seen: false,
    };
    assert.equal(streetStalkerDue(due), true);
    assert.equal(streetStalkerDue({ ...due, gateStarted: false }), false);
    assert.equal(streetStalkerDue({ ...due, seen: true }), false);
    assert.equal(streetStalkerDue({ ...due, fromScene: "street" }), false);
    assert.equal(streetStalkerDue({ ...due, inConversation: true }), false);
    assert.equal(STREET_STALKER_THOUGHT, "Him. Across the street. Not moving.");
    assert.equal(STREET_STALKER_GONE, "Gone. Didn't even hear a car.");
    assert.equal(nextStalkerCount(0), 1);
    assert.equal(nextStalkerCount(STALKER_MAX), STALKER_MAX);
  });

  it("hides the second sighting behind the Sunday sheet, then Linda asks", () => {
    const sheet = {
      ...quiet,
      sceneId: "street",
      dayNumber: 3,
      time: 8 * 60,
      seen: false,
    };
    assert.equal(sheetStalkerDue(sheet), true);
    assert.equal(sheetStalkerDue({ ...sheet, time: 12 * 60 }), false);
    assert.equal(sheetStalkerDue({ ...sheet, dayNumber: 2 }), false);
    assert.equal(sheetStalkerDue({ ...sheet, sceneId: "front-yard" }), false);
    assert.equal(sheetStalkerDue({ ...sheet, seen: true }), false);
    assert.deepEqual([...SHEET_LINES], [
      "Somebody behind the sheets on the line.",
      "Just a sheet. Just the wind.",
      "There's no wind.",
    ]);
    const ask = {
      sceneId: "kitchen",
      dayNumber: 3,
      time: 12 * 60,
      sheetSeen: true,
      heard: false,
    };
    assert.equal(lindaSheetDue(ask), true);
    assert.equal(lindaSheetDue({ ...ask, sheetSeen: false }), false);
    assert.equal(lindaSheetDue({ ...ask, time: 12 * 60 - 1 }), false);
    assert.equal(lindaSheetDue({ ...ask, heard: true }), false);
    assert.equal(
      LINDA_SHEET_LINES[0]?.type === "conversation" && LINDA_SHEET_LINES[0].text,
      "Have you seen my good white sheet? The one off the line?",
    );
    assert.equal(LINDA_SHEET_LINES[1]?.type === "conversation" && LINDA_SHEET_LINES[1].text, "No.");
    assert.equal(
      LINDA_SHEET_LINES[2]?.type === "conversation" && LINDA_SHEET_LINES[2].text,
      "Funny. It was there last night.",
    );
  });

  it("counts the Sunday woods figure and still shows him later without a fourth sighting", () => {
    const woods = {
      ...quiet,
      sceneId: "elrod-backyard",
      dayNumber: 3,
      time: 15 * 60,
      bootPrintSeen: true,
      seen: false,
    };
    assert.equal(woodsFigureDue(woods), true);
    assert.equal(woodsSightingCounts(woods), true);
    assert.equal(woodsFigureDue({ ...woods, time: 14 * 60 }), false);
    assert.equal(woodsFigureDue({ ...woods, lastAt: 3 * 1440 + 14 * 60 }), true);
    assert.equal(woodsSightingCounts({ ...woods, lastAt: 3 * 1440 + 14 * 60, sightings: STALKER_MAX }), true);
    assert.equal(nextStalkerCount(STALKER_MAX), STALKER_MAX);
    assert.equal(woodsFigureDue({ ...woods, dayNumber: 4, time: 15 * 60 }), true);
    assert.equal(woodsSightingCounts({ ...woods, dayNumber: 4 }), false);
    assert.equal(restoredStalkerCount(undefined, {
      streetStalkerSeen: true,
      sheetStalkerSeen: true,
      daytimeFigureSeen: true,
    }), 3);
    assert.equal(restoredStalkerCount(1, { daytimeFigureSeen: true }), 1);
  });

  it("delays the street sighting while the unseen woods figure owns 15:00–17:00", () => {
    const street = {
      ...quiet,
      fromScene: "diner-inside",
      sceneId: "diner",
      dayNumber: 3,
      time: 15 * 60,
      gateStarted: true,
      seen: false,
      bootPrintSeen: true,
      figureSeen: false,
      lastAt: null,
    };
    assert.equal(streetStalkerDue(street), false);
    assert.equal(streetStalkerDue({ ...street, time: 17 * 60 }), true);
    assert.equal(streetStalkerDue({ ...street, time: 15 * 60 - 1 }), true);
    assert.equal(streetStalkerDue({ ...street, figureSeen: true }), true);
    assert.equal(streetStalkerDue({ ...street, bootPrintSeen: false }), true);
    assert.equal(streetStalkerDue({ ...street, dayNumber: 2 }), true);
    const woods = {
      ...quiet,
      sceneId: "elrod-backyard",
      dayNumber: 3,
      time: 15 * 60,
      bootPrintSeen: true,
      seen: false,
      lastAt: 3 * 1440 + 14 * 60,
      sightings: STALKER_MAX,
    };
    assert.equal(woodsFigureDue(woods), true);
    assert.equal(woodsSightingCounts(woods), true);
  });
});

describe("Miller Lake", () => {
  it("opens from 1966 or Old Friends, and only between 07:00 and 18:00", () => {
    assert.equal(millerLakeUnlocked({ has1966: true, oldFriendsDone: false }), true);
    assert.equal(millerLakeUnlocked({ has1966: false, oldFriendsDone: true }), true);
    assert.equal(millerLakeUnlocked({ has1966: false, oldFriendsDone: false }), false);
    assert.equal(millerClosed(7 * 60), false);
    assert.equal(millerClosed(18 * 60 - 1), false);
    assert.equal(millerClosed(18 * 60), true);
    assert.equal(millerClosed(6 * 60), true);
    assert.equal(millerTripClosed(17 * 60 + 30, 45), true);
    assert.equal(millerTripClosed(12 * 60, 45), false);
  });

  it("keeps the book dry and connects it to the woods road without a quest", () => {
    assert.equal(MILLER_ARRIVAL, "Miller Lake. Dad and Walter's spot. Nobody fishes here anymore.");
    assert.equal(MILLER_CAMP, "CAMP PINEWOOD. Closed since '72. Of course it is.");
    assert.equal(MILLER_CABIN, "Somebody's been sleeping here. Blanket's still warm.");
    assert.equal(MILLER_DOCK, "Something under the dock. I'm not checking.");
    assert.equal(MILLER_CHECK, "...I'm checking.");
    assert.equal(MILLER_BOOK, "Her algebra book. Her name inside. It's dry. Ten years, and it's dry.");
    assert.equal(MILLER_RECENT, "Somebody put this here. Recently.");
    assert.equal(CLUE_DEFS["algebra-book"].name, "Her algebra book");
    assert.equal(CLUE_DEFS["algebra-book"].caption, "Emily P.");
    assert.equal(CLUE_DEFS["algebra-book"].worn, true);
    const link = CLUE_CONNECTIONS.find((item) => item.id === "book-woods");
    assert.equal(link?.thought, BOOK_WOODS_THOUGHT);
    assert.equal(connectionStartsOldFriends("book-woods"), false);
  });
});

describe("the second phone and the ending", () => {
  it("whispers his name the first time he comes home after 20:00 on day 2", () => {
    const home = {
      answered: true,
      heard: false,
      dayNumber: 3,
      time: 20 * 60,
      fromScene: "street",
      toScene: "front-yard",
    };
    assert.equal(nightWhisperDue(home), true);
    assert.equal(nightWhisperDue({ ...home, answered: false }), false);
    assert.equal(nightWhisperDue({ ...home, heard: true }), false);
    assert.equal(nightWhisperDue({ ...home, time: 20 * 60 - 1 }), false);
    assert.equal(nightWhisperDue({ ...home, dayNumber: 2 }), false);
    assert.equal(nightWhisperDue({ ...home, fromScene: "kitchen", toScene: "hallway" }), false);
    assert.equal(NIGHT_WHISPER_LINES[1]?.type === "narration" && NIGHT_WHISPER_LINES[1].text, NIGHT_WHISPER_NAME);
    assert.equal(NIGHT_WHISPER_LINES[1]?.type === "narration" && NIGHT_WHISPER_LINES[1].whisper, true);
    assert.equal(NAME_WHISPER_THOUGHT, "He knows my name.");
  });

  it("runs the only timed choice for six seconds and hides when nobody answers", () => {
    assert.equal(TIMED_CHOICE_MS, 6000);
    assert.equal(TIMED_CHOICE_STEPS, 6);
    assert.equal(TIMED_CHOICE_BUTTON_MIN_PX >= 44, true);
    assert.equal(timedChoiceEnabled(true), true);
    assert.equal(timedChoiceEnabled(false), false);
    assert.equal(unansweredEscape(), "hide");
    const hide = escapeSteps("hide", true);
    assert.deepEqual(hide.map((step) => step.text).filter(Boolean), [...HIDE_LINES]);
    assert.equal(hide.find((step) => step.black)?.ms, HIDE_BLACK_MS);
    assert.equal(hide[hide.length - 1]?.strip, "open");
    assert.equal(hide.every((step) => step.shake === false), true);
    const run = escapeSteps("run", false);
    assert.equal(run[0]?.text, RUN_LINES[0]);
    assert.equal(run[0]?.shake, true);
    assert.equal(escapeSteps("run", true)[0]?.shake, false);
    assert.equal(run.find((step) => step.figure)?.ms, RUN_FIGURE_MS);
    assert.equal(run[run.length - 1]?.black, true);
  });

  it("puts the hair tie and the figure before the choice, then the question, then the clues", () => {
    const frames = endingFrames(["the-woods-road", "room-6"]);
    assert.deepEqual(frames.map((frame) => frame.thought), [
      "Next to the cigarette. A hair tie. Pink, little flowers.",
      "That's hers.",
      "Ten years. Somebody kept it ten years.",
      "Someone's here.",
    ]);
    assert.equal(frames[3]?.after, "timed-choice");
    const after = endingAfterEscape(["the-woods-road", "room-6"]);
    assert.equal(after[0]?.thought, LET_GO_THOUGHT);
    assert.deepEqual(after.slice(1).map((frame) => frame.thought), [
      "She was walking up. Not down.",
      "Room 6. Mud on the carpet. Friday.",
    ]);
  });
});

describe("dark humor, once", () => {
  it("uses the lock, the deadbolts, and the towels", () => {
    assert.equal(LOCK_JOKE, "Great. Now I check locks. I'm my mother.");
    assert.equal(margaretDeadboltDue({ dayNumber: 3, heard: false }), true);
    assert.equal(margaretDeadboltDue({ dayNumber: 3, heard: true }), false);
    assert.equal(margaretDeadboltDue({ dayNumber: 2, heard: false }), false);
    assert.equal(MARGARET_DEADBOLT.includes("deadbolts"), true);
    assert.equal(earlTowelDue({ dayNumber: 3, room6Heard: true, heard: false }), true);
    assert.equal(earlTowelDue({ dayNumber: 3, room6Heard: false, heard: false }), false);
    assert.equal(earlTowelDue({ dayNumber: 4, room6Heard: true, heard: false }), false);
    assert.equal(EARL_TOWEL, "Room 6 asked for extra towels. Didn't say why. I didn't ask.");
  });
});

describe("delivered plates", () => {
  it("picks Emily's stone and the woods figure by weather", () => {
    assert.match(emilyGraveStoneImage("Sunny", 10 * 60), /emilyGraveStoneSunny\.png$/);
    assert.match(emilyGraveStoneImage("Cloudy", 10 * 60), /emilyGraveStoneSunny\.png$/);
    assert.match(emilyGraveStoneImage("Rainy", 10 * 60), /emilyGraveStoneRainy\.png$/);
    assert.match(emilyGraveStoneImage("Heavy rain", 10 * 60), /emilyGraveStoneRainy\.png$/);
    assert.match(emilyGraveStoneImage("Thunderstorm", 10 * 60), /emilyGraveStoneThunder\.png$/);
    assert.match(emilyGraveStoneImage("Sunny", 19 * 60), /emilyGraveStoneNight\.png$/);
    assert.match(elrodShadowPlate("Sunny", 16 * 60), /elrodHouseBackyardDayShadowInWood\.png$/);
    assert.match(elrodShadowPlate("Rainy", 16 * 60), /elrodHouseBackyardRainyShadowInWood\.png$/);
    assert.match(elrodShadowPlate("Thunderstorm", 16 * 60), /elrodHouseBackyardThunderShadowInWood\.png$/);
    assert.match(elrodShadowPlate("Sunny", 20 * 60), /elrodHouseBackyardNightShadowInWood\.png$/);
    assert.equal(STALKER_FIGURE, "/images/ui/stalkerFigure.png");
    assert.match(HOODED_FALLBACK, /sanatoriumMainFloorNightShadow\.png$/);
    const plates = [
      STALKER_FIGURE,
      HOODED_FALLBACK,
      WALTER_AT_STONE,
      ...Object.values(MILLER_PLATES),
      ...Object.values(MILLER_FALLBACK),
      emilyGraveStoneImage("Sunny", 10 * 60),
      emilyGraveStoneImage("Rainy", 10 * 60),
      emilyGraveStoneImage("Thunderstorm", 10 * 60),
      emilyGraveStoneImage("Sunny", 20 * 60),
      elrodShadowPlate("Sunny", 16 * 60),
      elrodShadowPlate("Rainy", 16 * 60),
      elrodShadowPlate("Thunderstorm", 16 * 60),
      elrodShadowPlate("Sunny", 20 * 60),
    ];
    for (const plate of plates) {
      assert.equal(plate.startsWith("./"), false, plate);
      assert.equal(plate.startsWith("/images/"), true, plate);
    }
  });
});
