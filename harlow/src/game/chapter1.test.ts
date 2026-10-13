import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { conversationChoiceVisible } from "./conversationChoices.ts";
import {
  CEMETERY_LUNCH,
  cemeteryCrossVisible,
  cemeteryLunchDue,
  dayCardLine,
  daysSinceEmilyVanished,
  displayedClock,
  EARL_CASH_LINE,
  earlCashDue,
  emilyDayCount,
  FOLDER_SNOOP_LINES,
  folderSnoopDue,
  LINDA_PHONE_LINES,
  lindaPhoneDue,
  MARGARET_DAY2_LINES,
  margaretDay2Due,
  RACHEL_DAY2_LINES,
  rachelDay2Due,
  daytimeFigureDue,
  emilyDoorAjarDue,
  endingFrames,
  endingThoughts,
  folderLook,
  gravelWalkDue,
  hillDarkDue,
  hillPrintMissedDue,
  HILL_PRINT_MISSED,
  homeNightWeather,
  isHomeScene,
  nightCallRings,
  porchNeedlesDue,
  PINE_NEEDLE_LINES,
  rachelDrawn,
  sidePanelDate,
  syncChapterQuests,
  titleCardDate,
} from "./chapter1.ts";
import { isChoiceAvailable } from "./choiceAvailability.ts";
import { shouldNoticeHill } from "./hill.ts";
import { momConversation } from "./scene/home.ts";
import { timeHint, WAITING_TIRED_HINT } from "./timeHints.ts";
import { defaultTrust } from "./trust.ts";
import type { GameState } from "./types.ts";
import type { QuestProgress, StoryFlag } from "./quests.ts";

const ready: QuestProgress[] = [
  { id: "what-walter-said", status: "completed" },
  { id: "faded-poster", status: "completed" },
];

function state(partial: Partial<GameState>): GameState {
  return {
    time: 10 * 60,
    dayOfWeek: "Saturday",
    dayNumber: 2,
    currentMonth: "October",
    weather: "Cloudy",
    location: "Home",
    ...partial,
  };
}

function choiceCtx(partial: {
  time?: number;
  dayOfWeek?: GameState["dayOfWeek"];
  dayNumber?: number;
  sceneId?: string;
  flags?: StoryFlag[];
  quests?: QuestProgress[];
  job?: "needle-groove" | null;
  knife?: boolean;
  momTalked?: boolean;
}) {
  const flags = new Set(partial.flags ?? []);
  return {
    gameState: state({
      time: partial.time ?? 10 * 60,
      dayOfWeek: partial.dayOfWeek ?? "Saturday",
      dayNumber: partial.dayNumber ?? 2,
    }),
    currentSceneId: partial.sceneId ?? "front-yard",
    momTalked: partial.momTalked ?? true,
    job: partial.job ?? null,
    jobQuestTarget: null,
    quests: partial.quests ?? [],
    marleneActive: false,
    deskCigarettesPickedUp: false,
    scrapyardKnifePickedUp: partial.knife ?? false,
    garageFlashlightPickedUp: false,
    inventory: [],
    storyFlags: Object.fromEntries([...flags].map((flag) => [flag, true])),
    hasFlag: (flag: StoryFlag) => flags.has(flag),
    hasAllFlags: (list?: StoryFlag[] | StoryFlag) => {
      if (!list) return true;
      const items = Array.isArray(list) ? list : [list];
      return items.every((flag) => flags.has(flag));
    },
    hasAnyFlag: (list?: StoryFlag[] | StoryFlag) => {
      if (!list) return false;
      const items = Array.isArray(list) ? list : [list];
      return items.some((flag) => flags.has(flag));
    },
  };
}

describe("opening date", () => {
  it("matches the side panel on Saturday, October 2", () => {
    assert.equal(sidePanelDate("Saturday", "October", 2), "Saturday, October 2");
    assert.equal(titleCardDate("Saturday", "October", 2), "Saturday, October 2, 1982");
    assert.equal(dayCardLine("Sunday", "October", 3), "SUNDAY, OCTOBER 3, 1982");
  });

  it("counts the days since Emily vanished, with October 2 1972 as day 0", () => {
    assert.equal(daysSinceEmilyVanished("October", 2), 3652);
    assert.equal(daysSinceEmilyVanished("October", 3), 3653);
    assert.equal(emilyDayCount("October", 2), "Day 3,652");
    assert.equal(emilyDayCount("October", 3), "Day 3,653");
    assert.equal(daysSinceEmilyVanished("October", 4), 3654);
  });
});

describe("flavour lines", () => {
  it("has Linda ask about the phone on Sunday morning in the kitchen", () => {
    const due = {
      sceneId: "kitchen",
      dayNumber: 3,
      time: 8 * 60,
      heardCall: true,
      heard: false,
    };
    assert.equal(lindaPhoneDue(due), true);
    assert.equal(lindaPhoneDue({ ...due, heardCall: false }), false);
    assert.equal(lindaPhoneDue({ ...due, sceneId: "living-room" }), false);
    assert.equal(lindaPhoneDue({ ...due, time: 14 * 60 }), false);
    assert.equal(lindaPhoneDue({ ...due, heard: true }), false);
    assert.deepEqual(LINDA_PHONE_LINES.map((line) => line.type === "conversation" ? line.text : ""), [
      "Did the phone ring last night? I dreamed it rang.",
      "Wrong number.",
      "At two in the morning?",
      "...Lock the door when you go out, honey.",
    ]);
  });

  it("gives Rachel and Margaret one Sunday talk, and Earl the visit after Room 6", () => {
    assert.equal(rachelDay2Due({ dayNumber: 3, heard: false }), true);
    assert.equal(rachelDay2Due({ dayNumber: 2, heard: false }), false);
    assert.equal(RACHEL_DAY2_LINES[0]?.type === "conversation" && RACHEL_DAY2_LINES[0].text, "Couldn't sleep. Kept thinking I heard her gate.");
    assert.equal(RACHEL_DAY2_LINES[1]?.type === "conversation" && RACHEL_DAY2_LINES[1].text, "It's been taped shut since Saturday, Ethan.");
    assert.equal(margaretDay2Due({ dayNumber: 3, heard: false }), true);
    assert.equal(margaretDay2Due({ dayNumber: 3, heard: true }), false);
    assert.equal(
      MARGARET_DAY2_LINES[0]?.type === "conversation" && MARGARET_DAY2_LINES[0].text,
      "Sheriff says stay calm. So I'm calm. I'm calm with the shotgun under the register.",
    );
    assert.equal(
      MARGARET_DAY2_LINES[1]?.type === "conversation" && MARGARET_DAY2_LINES[1].text,
      "More coffee? It's the only thing in this town that's still hot.",
    );
    assert.equal(earlCashDue({ room6Heard: true, heard: false }), true);
    assert.equal(earlCashDue({ room6Heard: false, heard: false }), false);
    assert.equal(earlCashDue({ room6Heard: true, heard: true }), false);
    assert.equal(
      EARL_CASH_LINE,
      "Don't look at me like that. Cash is cash. I'm not the one who asks questions in this town. That's Walter's job, and look how that's going.",
    );
  });

  it("changes Walter's line the second time he catches Ethan at the folder", () => {
    assert.equal(folderSnoopDue({ caughtBefore: false, heard: false }), false);
    assert.equal(folderSnoopDue({ caughtBefore: true, heard: false }), true);
    assert.equal(folderSnoopDue({ caughtBefore: true, heard: true }), false);
    assert.equal(FOLDER_SNOOP_LINES[0]?.type === "conversation" && FOLDER_SNOOP_LINES[0].text, "Your sister used to snoop too, kid.");
    assert.equal(FOLDER_SNOOP_LINES[0]?.type === "conversation" && FOLDER_SNOOP_LINES[0].pauseAfter, 1000);
    assert.equal(FOLDER_SNOOP_LINES[1]?.type === "conversation" && FOLDER_SNOOP_LINES[1].text, "Go home.");
  });

  it("mentions the cemetery on the Sunday map after lunch, once", () => {
    const due = { dayNumber: 3, time: 13 * 60, momTalked: true, heard: false };
    assert.equal(cemeteryLunchDue(due), true);
    assert.equal(cemeteryLunchDue({ ...due, time: 12 * 60 + 59 }), false);
    assert.equal(cemeteryLunchDue({ ...due, momTalked: false }), false);
    assert.equal(cemeteryLunchDue({ ...due, heard: true }), false);
    assert.equal(cemeteryLunchDue({ ...due, dayNumber: 4 }), false);
    assert.equal(CEMETERY_LUNCH, "Sunday. Mom used to drag me to the cemetery after lunch. Somebody probably still goes.");
    assert.equal(cemeteryCrossVisible({ dayNumber: 3, time: 13 * 60, momTalked: true }), true);
    assert.equal(cemeteryCrossVisible({ dayNumber: 3, time: 13 * 60, momTalked: false }), false);
  });

  it("holds the clock at 02:00 until the phone call is finished", () => {
    assert.equal(displayedClock(7 * 60, true), 2 * 60);
    assert.equal(displayedClock(2 * 60, true), 2 * 60);
    assert.equal(displayedClock(7 * 60, false), 7 * 60);
  });
});

describe("night call", () => {
  it("rings once, at home, when the clock passes 02:00 on the first night", () => {
    const home = {
      heard: false,
      fromTime: 90,
      toTime: 150,
      fromDay: 3,
      toDay: 3,
      fromScene: "hallway",
      toScene: "kitchen",
    };
    assert.equal(nightCallRings(home), true);
    assert.equal(nightCallRings({ ...home, heard: true }), false);
    assert.equal(nightCallRings({ ...home, fromScene: "diner" }), false);
    assert.equal(nightCallRings({ ...home, toScene: "street" }), false);
    assert.equal(isHomeScene("front-yard"), true);
    assert.equal(isHomeScene("light-pole"), false);
  });

  it("wakes a sleeper at 02:00 and stays quiet if he is already out", () => {
    assert.equal(nightCallRings({
      heard: false,
      fromTime: 23 * 60,
      toTime: 7 * 60,
      fromDay: 2,
      toDay: 3,
      fromScene: "ethan-room",
      toScene: "ethan-room",
    }), true);
    assert.equal(nightCallRings({
      heard: false,
      fromTime: 90,
      toTime: 150,
      fromDay: 3,
      toDay: 3,
      fromScene: "diner",
      toScene: "motel",
    }), false);
    assert.equal(nightCallRings({
      heard: false,
      fromTime: 90,
      toTime: 150,
      fromDay: 4,
      toDay: 4,
      fromScene: "hallway",
      toScene: "hallway",
    }), false);
  });

  it("keeps the house dry after he answers", () => {
    assert.equal(homeNightWeather("Rainy", "kitchen", 3 * 60, true), "Cloudy");
    assert.equal(homeNightWeather("Rainy", "diner", 3 * 60, true), "Rainy");
    assert.equal(homeNightWeather("Rainy", "kitchen", 8 * 60, true), "Rainy");
  });
});

describe("hill gate", () => {
  const print = { bootPrintSeen: true };

  it("waits for the boot print and Sunday evening", () => {
    assert.equal(shouldNoticeHill("front-yard", 18 * 60 + 20, ready, print, 3), true);
    assert.equal(shouldNoticeHill("front-yard", 18 * 60 + 20, ready, {}, 3), false);
    assert.equal(shouldNoticeHill("front-yard", 18 * 60 + 20, ready, print, 2), false);
    assert.equal(shouldNoticeHill("front-yard", 2 * 60, ready, print, 3), false);
    assert.equal(shouldNoticeHill("diner", 18 * 60 + 20, ready, print, 3), false);
    assert.equal(
      shouldNoticeHill("front-yard", 19 * 60, ready, print, 4),
      true,
    );
  });

  it("does not restart a hill quest that is already underway", () => {
    const started: QuestProgress[] = [...ready, { id: "light-on-the-hill", status: "active" }];
    assert.equal(shouldNoticeHill("front-yard", 19 * 60, started, print, 3), false);
  });

  it("names Elrod's yard on Sunday evening when only the boot print is missing", () => {
    const blocked = {
      sceneId: "front-yard",
      dayNumber: 3,
      time: 18 * 60,
      quests: ready,
      flags: {},
      heard: false,
    };
    assert.equal(hillPrintMissedDue(blocked), true);
    assert.equal(
      HILL_PRINT_MISSED,
      "The hill's dark. Maybe I missed something in Mrs. Elrod's yard.",
    );
    assert.equal(hillPrintMissedDue({ ...blocked, flags: print }), false);
    assert.equal(hillPrintMissedDue({ ...blocked, heard: true }), false);
    assert.equal(hillPrintMissedDue({ ...blocked, dayNumber: 2 }), false);
    assert.equal(hillPrintMissedDue({ ...blocked, dayNumber: 4 }), false);
    assert.equal(hillPrintMissedDue({ ...blocked, time: 17 * 60 }), false);
    assert.equal(hillPrintMissedDue({ ...blocked, sceneId: "street" }), false);
    assert.equal(hillPrintMissedDue({ ...blocked, quests: [] }), false);
    const started: QuestProgress[] = [...ready, { id: "light-on-the-hill", status: "active" }];
    assert.equal(hillPrintMissedDue({ ...blocked, quests: started }), false);
  });
});

describe("sunday morning and the afternoon figure", () => {
  it("notices pine needles only on the first Sunday-morning visit", () => {
    assert.equal(porchNeedlesDue({
      sceneId: "front-yard", dayNumber: 3, time: 9 * 60, seen: false,
    }), true);
    assert.equal(porchNeedlesDue({
      sceneId: "front-yard", dayNumber: 3, time: 12 * 60, seen: false,
    }), false);
    assert.equal(porchNeedlesDue({
      sceneId: "front-yard", dayNumber: 4, time: 9 * 60, seen: false,
    }), false);
    assert.equal(hillDarkDue({
      sceneId: "front-yard", dayNumber: 2, time: 18 * 60, heard: false,
    }), true);
  });

  it("puts the hooded figure in the backyard after the print, from Sunday on", () => {
    assert.equal(daytimeFigureDue({
      sceneId: "elrod-backyard",
      dayNumber: 3,
      time: 15 * 60,
      bootPrintSeen: true,
      seen: false,
    }), true);
    assert.equal(daytimeFigureDue({
      sceneId: "elrod-backyard",
      dayNumber: 2,
      time: 15 * 60,
      bootPrintSeen: true,
      seen: false,
    }), false);
  });
});

describe("folder look", () => {
  const seen = { fileDrawerSeen: true };

  it("is safe before 17:30, then Walter walks in", () => {
    assert.equal(folderLook({ ...seen, time: 16 * 60 }), "open");
    assert.equal(folderLook({ ...seen, time: 17 * 60 + 30 }), "caught");
    assert.equal(folderLook({ ...seen, time: 17 * 60 + 30, rachelFolderCover: true }), "open");
    assert.equal(folderLook({ ...seen, time: 16 * 60, folderLockedToday: true }), "locked");
    assert.equal(folderLook({ ...seen, time: 18 * 60 }), "rings");
    assert.equal(folderLook({ ...seen, time: 16 * 60, emilyFileOpened: true }), "gone");
  });
});

describe("optional quests", () => {
  it("starts from the day or the corkboard link, never from trust", () => {
    const sunday = syncChapterQuests(
      [
        { id: "emilys-room", status: "completed" },
        { id: "what-walter-said", status: "completed" },
      ],
      3,
      ["walt-parker"],
    );
    assert.ok(sunday.some((quest) => quest.id === "old-friends" && quest.status === "active"));
    assert.ok(sunday.some((quest) => quest.id === "before-everything"));
    assert.ok(sunday.some((quest) => quest.id === "rachel-remembers"));
    const saturday = syncChapterQuests(
      [{ id: "emilys-room", status: "completed" }],
      2,
      [],
    );
    assert.equal(saturday.some((quest) => quest.id === "before-everything"), false);
  });

  it("lets Mom refuse without finishing Before Everything", () => {
    const base = {
      storyFlags: {},
      quests: [{ id: "before-everything" as const, status: "active" as const }],
      job: null,
      jobQuestTarget: null,
      usedLabels: [] as string[],
      openedAsEmployee: false,
      inventory: [] as string[],
      trust: { ...defaultTrust(), linda: -1 },
      money: 0,
      sceneId: "kitchen",
      time: 13 * 60,
      dayNumber: 3,
      clues: [] as const,
    };
    const refusal = momConversation.choices.find(
      (choice) => choice.label.startsWith("Tell me about Dad") && choice.requiresTrust?.max === -1,
    );
    const told = momConversation.choices.find(
      (choice) => choice.label.startsWith("Tell me about Dad") && choice.storyFlag === "dad1966Told",
    );
    const closed = momConversation.choices.find(
      (choice) => choice.label.startsWith("Tell me about Dad")
        && choice.requiresTrust?.min === 0
        && choice.requiresTrust?.max === 0,
    );
    assert.ok(refusal && told && closed);
    assert.equal(conversationChoiceVisible(refusal, base), true);
    assert.equal(refusal.completesQuest, undefined);
    assert.equal(closed.completesQuest, "before-everything");
    assert.equal(closed.storyFlag, undefined);
    assert.equal(told.completesQuest, "before-everything");
    assert.equal(conversationChoiceVisible(told, { ...base, trust: { ...defaultTrust(), linda: 1 } }), true);
    assert.equal(conversationChoiceVisible(closed, { ...base, trust: defaultTrust() }), true);
  });
});

describe("night two and the road home", () => {
  it("uses the porch line about the steps", () => {
    assert.equal(PINE_NEEDLE_LINES[1], "Nobody walks up our steps from the woods.");
  });

  it("opens Emily's door once, upstairs, after 20:00 on day 2", () => {
    const due = {
      sceneId: "hallway-upstairs",
      dayNumber: 3,
      time: 20 * 60,
      seen: false,
    };
    assert.equal(emilyDoorAjarDue(due), true);
    assert.equal(emilyDoorAjarDue({ ...due, time: 20 * 60 - 1 }), false);
    assert.equal(emilyDoorAjarDue({ ...due, dayNumber: 2 }), false);
    assert.equal(emilyDoorAjarDue({ ...due, dayNumber: 4 }), false);
    assert.equal(emilyDoorAjarDue({ ...due, sceneId: "emily-room" }), false);
    assert.equal(emilyDoorAjarDue({ ...due, seen: true }), false);
  });

  it("plays gravel footsteps only on the way home before he goes in", () => {
    const home = {
      fromScene: "sanatorium",
      toScene: "front-yard",
      hillActive: true,
      entered: false,
      heard: false,
    };
    assert.equal(gravelWalkDue(home), true);
    assert.equal(gravelWalkDue({ ...home, entered: true }), false);
    assert.equal(gravelWalkDue({ ...home, heard: true }), false);
    assert.equal(gravelWalkDue({ ...home, hillActive: false }), false);
    assert.equal(gravelWalkDue({ ...home, fromScene: "sanatorium-entrance" }), false);
    assert.equal(gravelWalkDue({ ...home, toScene: "diner" }), false);
  });
});

describe("ending order", () => {
  it("puts the hair tie, then the figure, then one line per optional clue", () => {
    const frames = endingFrames([
      "room-6",
      "every-sunday",
      "fresh-flowers",
      "year-1966",
      "the-woods-road",
      "trail-up-the-hill",
    ]);
    assert.deepEqual(frames.map((frame) => frame.thought), [
      "Next to the cigarette. A hair tie. Pink, little flowers.",
      "That's hers.",
      "Ten years. Somebody kept it ten years.",
      "Someone's here.",
      ...endingThoughts([
        "room-6",
        "every-sunday",
        "fresh-flowers",
        "year-1966",
        "the-woods-road",
        "trail-up-the-hill",
      ]),
    ]);
    assert.equal(frames[0]?.flags?.[0], "hairTieFound");
    assert.equal(frames[0]?.split?.left, "/images/misc/oldEmilyEthanPhoto.png");
    assert.equal(frames[3]?.thought, "Someone's here.");
    assert.deepEqual(endingThoughts(["room-6", "every-sunday"]), [
      "Every Sunday. He still goes.",
      "Room 6. Mud on the carpet. Friday.",
    ]);
  });
});

describe("time hints", () => {
  const hint = (action: string, partial: Parameters<typeof choiceCtx>[0]) => timeHint({
    action,
    sceneId: partial.sceneId ?? "front-yard",
    time: partial.time ?? 10 * 60,
    dayOfWeek: partial.dayOfWeek ?? "Saturday",
    job: partial.job ?? null,
    flags: Object.fromEntries((partial.flags ?? []).map((flag) => [flag, true])),
    quests: partial.quests ?? [],
    knifeTaken: partial.knife ?? false,
  });

  it("uses the approved lines and leaves the action alone inside its window", () => {
    assert.equal(hint("talkToMom", { sceneId: "kitchen", time: 6 * 60 }), "Mom's not up yet. Or she's already gone.");
    assert.equal(hint("talkToMom", { sceneId: "kitchen", time: 8 * 60 }), null);
    assert.equal(hint("goToSleep", { sceneId: "ethan-room", time: 21 * 60 }), "Too early. I wouldn't sleep anyway.");
    assert.equal(hint("goToSleep", { sceneId: "ethan-room", time: 22 * 60 }), null);
    assert.equal(
      hint("lookAtGazette", { time: 13 * 60, dayOfWeek: "Saturday" }),
      "Somebody already took the paper in.",
    );
    assert.equal(
      hint("lookAtSanatoriumHill", {
        time: 15 * 60,
        quests: [{ id: "light-on-the-hill", status: "active" }],
      }),
      "The hill looks normal in daylight. That's the trouble with it.",
    );
    assert.equal(
      hint("lookAtElrodBootPrint", { time: 4 * 60, flags: ["margaretGossipHeard"] }),
      "Too dark back there. I'd step right on it.",
    );
    assert.equal(
      hint("lookAtElrodBootPrint", { time: 4 * 60, flags: ["hillPrintHint"] }),
      "Too dark back there. I'd step right on it.",
    );
    assert.equal(
      hint("lookAtEmilyFolder", { time: 18 * 60, flags: ["fileDrawerSeen"] }),
      "His desk. Nothing on it but coffee rings.",
    );
    assert.equal(
      hint("lookAtEmilyFolder", { time: 16 * 60, flags: ["fileDrawerSeen", "emilyFileOpened"] }),
      "The folder's gone. He moved it.",
    );
    assert.equal(hint("enterDiner", { time: 6 * 60 }), "Closed. Margaret's not in yet.");
    assert.equal(hint("talkToJohnny", { time: 15 * 60 }), "Sign says back in five. It always says that.");
    assert.equal(
      hint("workNeedleGrooveShift", { time: 9 * 60, job: "needle-groove" }),
      "Johnny doesn't need me now.",
    );
    assert.equal(hint("takeScrapyardKnife", { time: 10 * 60 }), "Roy's watching. Not with him standing right there.");
    assert.equal(
      hint("lookAtSanatoriumCigarette", { time: 8 * 60, flags: ["sanatoriumCigaretteSeen"] }),
      "The butt's gone. Somebody came back for it.",
    );
    assert.equal(WAITING_TIRED_HINT, "I can barely keep my eyes open. Go home, Ethan.");
  });

  it("keeps a time-hint button listed while the action itself stays unavailable", () => {
    const sleep = {
      label: "Sleep",
      action: "goToSleep",
      nextScene: "ethan-room",
      timeCost: 0,
    };
    assert.equal(isChoiceAvailable(sleep, choiceCtx({ sceneId: "ethan-room", time: 21 * 60 })), false);
    assert.equal(hint("goToSleep", { sceneId: "ethan-room", time: 21 * 60 }) !== null, true);
    assert.equal(rachelDrawn({
      time: 18 * 60,
      rachelMet: true,
      walterStationTalk: true,
      quests: [{ id: "what-walter-said", status: "completed" }],
    }), false);
    assert.equal(rachelDrawn({
      time: 17 * 60,
      rachelMet: true,
      walterStationTalk: true,
      quests: [{ id: "what-walter-said", status: "completed" }],
    }), true);
  });
});
