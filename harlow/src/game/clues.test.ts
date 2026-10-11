import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isChoiceAvailable, type ChoiceContext } from "./choiceAvailability.ts";
import {
  CLUE_DEFS,
  EMILY_THOUGHTS,
  NEWSPAPER,
  WRONG_CONNECTION_LINES,
  atticHotspotVisible,
  collectClue,
  connectionBetween,
  gateHotspotHidden,
  gazetteOnPorch,
  migrateClues,
  tryConnect,
  type ClueId,
} from "./clues.ts";
import {
  askCompletesGate,
  askTopicsFor,
  resolveAskAbout,
  trustBand,
} from "./askAbout.ts";
import { repeatVisitLine, visitHasNothingNew } from "./repeatVisits.ts";
import {
  advanceGatePrint,
  finishEmilyRoom,
  finishGate,
  migrateQuestsFromLegacy,
  questObjective,
  startEmilyRoom,
  startTheGate,
  type QuestProgress,
  type StoryFlag,
} from "./quests.ts";
import { attic, emilyRoom, momConversation } from "./scene/home.ts";
import { elrodHouse, frontYard, rachelFrontYardConversation } from "./scene/outdoors.ts";
import { sanatoriumRoom2 } from "./scene/sanatorium.ts";
import { walterConversation } from "./scene/town.ts";
import { defaultTrust, type TrustMap } from "./trust.ts";
import type { GameState } from "./types.ts";

function textOf(lines: { type: string; text?: string }[]) {
  return lines.map((line) => line.text ?? "").join("\n");
}

function availability(partial: {
  time?: number;
  dayOfWeek?: GameState["dayOfWeek"];
  scene?: string;
  flags?: Partial<Record<StoryFlag, boolean>>;
  quests?: QuestProgress[];
  momTalked?: boolean;
}): ChoiceContext {
  const storyFlags = partial.flags ?? {};
  const gameState: GameState = {
    dayNumber: 2,
    dayOfWeek: partial.dayOfWeek ?? "Saturday",
    time: partial.time ?? 10 * 60,
    location: "Elrod House",
    weather: "Sunny",
    currentMonth: "October",
  };
  return {
    gameState,
    currentSceneId: partial.scene ?? "elrod-house",
    momTalked: partial.momTalked ?? true,
    job: null,
    jobQuestTarget: null,
    quests: partial.quests ?? [],
    marleneActive: false,
    deskCigarettesPickedUp: false,
    scrapyardKnifePickedUp: false,
    garageFlashlightPickedUp: false,
    inventory: [],
    storyFlags,
    hasFlag: (flag) => Boolean(storyFlags[flag]),
    hasAllFlags: (flags) => {
      if (!flags) return true;
      const list = Array.isArray(flags) ? flags : [flags];
      return list.every((flag) => storyFlags[flag]);
    },
    hasAnyFlag: (flags) => {
      if (!flags) return false;
      const list = Array.isArray(flags) ? flags : [flags];
      return list.some((flag) => storyFlags[flag]);
    },
  };
}

describe("clue collection", () => {
  it("pins a clue once and keeps the note", () => {
    const first = collectClue([], "the-gazette");
    assert.equal(first.added, true);
    assert.deepEqual(first.clues, ["the-gazette"]);
    assert.equal(collectClue(first.clues, "the-gazette").added, false);
    assert.equal(CLUE_DEFS["the-gazette"].note, "Front page. \"Stay calm.\" Sure.");
    assert.equal(CLUE_DEFS["man-in-a-hood"].note, "End of the street. Just standing there. Watching.");
    assert.equal(CLUE_DEFS.cigarette.note, "Still burning. Someone was just here.");
  });
});

describe("clue connections", () => {
  const owned: ClueId[] = ["boot-print", "man-in-a-hood", "walt-and-me", "parker-e", "cigarette"];

  it("keeps a thread for a real pair, in either order", () => {
    const linked = tryConnect("boot-print", "man-in-a-hood", owned, [], 0);
    assert.equal(linked.status, "linked");
    if (linked.status !== "linked") return;
    assert.equal(linked.thought, "He came down from the hill.");
    assert.equal(linked.added, true);
    assert.deepEqual(linked.connections, ["hood-boot"]);

    const again = tryConnect("man-in-a-hood", "boot-print", owned, linked.connections, 0);
    assert.equal(again.status, "linked");
    if (again.status !== "linked") return;
    assert.equal(again.added, false);
    assert.deepEqual(again.connections, ["hood-boot"]);

    const walt = tryConnect("parker-e", "walt-and-me", owned, [], 0);
    assert.equal(walt.status, "linked");
    if (walt.status !== "linked") return;
    assert.equal(walt.thought, "He knew Dad. And he kept her file.");
    assert.equal(connectionBetween("cigarette", "boot-print"), null);
  });

  it("rejects a pair that does not connect", () => {
    const rejected = tryConnect("cigarette", "boot-print", owned, [], 0);
    assert.deepEqual(rejected, { status: "rejected", line: "Doesn't connect." });
    assert.equal(tryConnect("cigarette", "the-gazette", ["cigarette", "the-gazette"], [], 1).status, "rejected");
    assert.equal(
      (tryConnect("walt-and-me", "man-in-a-hood", owned, [], 2) as { line: string }).line,
      "That's not it.",
    );
    assert.deepEqual([...WRONG_CONNECTION_LINES], [
      "Doesn't connect.",
      "No. I'm reaching.",
      "That's not it.",
    ]);
  });
});

describe("ask about", () => {
  const trust: TrustMap = { rachel: 1, linda: 0, walter: -1, margaret: 2 };

  it("picks the line from the current trust and does not change it", () => {
    assert.equal(trustBand(2), "high");
    assert.equal(trustBand(0), "mid");
    assert.equal(trustBand(-2), "low");

    const highTrust: TrustMap = { ...trust, rachel: 1 };
    const high = resolveAskAbout({ person: "rachel", clue: "boot-print", trust: highTrust, asked: {} });
    assert.equal(high.trust, highTrust);
    assert.equal(high.trust.rachel, 1);
    assert.equal(high.trust.linda, 0);
    assert.equal(high.trust.walter, -1);
    assert.match(textOf(high.lines), /Pine needles\? Nothing like that on this street/);
    assert.match(textOf(high.lines), /The woods by the sanatorium\./);
    assert.match(textOf(high.lines), /Ethan\. Don't go up there alone\./);

    const mid = resolveAskAbout({ person: "rachel", clue: "boot-print", trust: { ...defaultTrust(), rachel: 0 }, asked: {} });
    assert.equal(mid.trust.rachel, 0);
    assert.match(textOf(mid.lines), /Lots of people walk that street\. Could be anyone's\./);

    const lowTrust = { ...defaultTrust(), rachel: -1 };
    const low = resolveAskAbout({ person: "rachel", clue: "boot-print", trust: lowTrust, asked: {} });
    assert.equal(low.trust, lowTrust);
    assert.match(textOf(low.lines), /Funny\. Now you want to talk\./);
    assert.equal(askCompletesGate("rachel", "boot-print"), true);

    const walterHigh = resolveAskAbout({
      person: "walter",
      clue: "boot-print",
      trust: { ...defaultTrust(), walter: 2 },
      asked: {},
    });
    assert.equal(walterHigh.trust.walter, 2);
    assert.match(textOf(walterHigh.lines), /Then keep it to yourself\. I mean it, kid\./);

    const walterMid = resolveAskAbout({
      person: "walter",
      clue: "boot-print",
      trust: defaultTrust(),
      asked: {},
    });
    assert.match(textOf(walterMid.lines), /Half this town wears boots, Ethan\./);

    const walterLow = resolveAskAbout({
      person: "walter",
      clue: "boot-print",
      trust: { ...defaultTrust(), walter: -1 },
      asked: {},
    });
    assert.equal(walterLow.trust.walter, -1);
    assert.match(textOf(walterLow.lines), /And what were you doing inside my tape\?/);
    assert.equal(askCompletesGate("walter", "boot-print"), true);

    const momHigh = resolveAskAbout({
      person: "linda",
      clue: "walt-and-me",
      trust: { ...defaultTrust(), linda: 1 },
      asked: {},
    });
    assert.equal(momHigh.trust.linda, 1);
    assert.match(textOf(momHigh.lines), /I found a picture of Dad and Walter at Miller Lake\./);
    assert.match(textOf(momHigh.lines), /Before everything, honey\./);

    const momMid = resolveAskAbout({
      person: "linda",
      clue: "walt-and-me",
      trust: defaultTrust(),
      asked: {},
    });
    assert.match(textOf(momMid.lines), /Put it back, please\./);

    const momLowTrust: TrustMap = { ...defaultTrust(), linda: -1 };
    const momLow = resolveAskAbout({
      person: "linda",
      clue: "walt-and-me",
      trust: momLowTrust,
      asked: {},
    });
    assert.equal(momLow.trust, momLowTrust);
    assert.match(textOf(momLow.lines), /I'm not doing this today, Ethan\./);

    const picture = resolveAskAbout({
      person: "walter",
      clue: "walt-and-me",
      trust: { ...defaultTrust(), walter: 1 },
      asked: {},
    });
    assert.match(textOf(picture.lines), /I found a picture of you and Dad\. Miller Lake, '64\./);
    assert.match(textOf(picture.lines), /Some things you don't put away, kid\./);
  });

  it("asks again with the brush-off, not the repeat-visit line", () => {
    const trustNow = { ...defaultTrust(), rachel: 1 };
    const again = resolveAskAbout({
      person: "rachel",
      clue: "boot-print",
      trust: trustNow,
      asked: { rachel: ["boot-print"] },
    });
    assert.equal(again.trust, trustNow);
    assert.match(textOf(again.lines), /You already asked me that, Ethan\./);
    assert.equal(textOf(again.lines).includes("Pine needles?"), false);
    assert.equal(textOf(again.lines).includes(repeatVisitLine("rachel", 10 * 60)), false);
    assert.match(
      textOf(resolveAskAbout({
        person: "walter",
        clue: "boot-print",
        trust: defaultTrust(),
        asked: { walter: ["boot-print"] },
      }).lines),
      /I heard you the first time\./,
    );
    assert.match(
      textOf(resolveAskAbout({
        person: "linda",
        clue: "walt-and-me",
        trust: defaultTrust(),
        asked: { linda: ["walt-and-me"] },
      }).lines),
      /We talked about this, honey\./,
    );
  });

  it("offers Boot print once it is found, and Walt & me only after the connection", () => {
    assert.deepEqual(askTopicsFor("rachel", ["boot-print"], []), ["boot-print"]);
    assert.deepEqual(askTopicsFor("linda", ["walt-and-me", "parker-e"], []), []);
    assert.deepEqual(
      askTopicsFor("linda", ["walt-and-me", "parker-e"], ["walt-parker"]),
      ["walt-and-me"],
    );
    assert.deepEqual(
      askTopicsFor("walter", ["boot-print", "walt-and-me"], ["walt-parker"]),
      ["boot-print", "walt-and-me"],
    );
    assert.equal(askCompletesGate("linda", "walt-and-me"), false);
  });
});

describe("sidequests", () => {
  it("starts The Gate from the gossip and finishes it when either person is asked", () => {
    const started = startTheGate([{ id: "the-tape", status: "active" }]);
    assert.equal(started.started, true);
    assert.equal(questObjective(started.quests[1]), "Somebody kept leaving her gate open.");
    assert.equal(started.quests.some((quest) => quest.id === "light-on-the-hill"), false);

    const printed = advanceGatePrint(started.quests);
    assert.equal(
      questObjective(printed.find((quest) => quest.id === "the-gate")!),
      "A boot print. Pine needles in the mud.",
    );
    const done = finishGate(printed);
    assert.equal(done.completed, true);
    assert.equal(
      questObjective(done.quests.find((quest) => quest.id === "the-gate")!),
      "Pine needles by her gate. Nobody listened.",
    );
    assert.equal(done.quests.filter((quest) => quest.id === "the-tape").length, 1);
    assert.equal(finishGate(done.quests).completed, false);
  });

  it("starts Emily's Room on the first look and ends it on the photograph", () => {
    const carried: QuestProgress[] = [{ id: "talk-to-mom", status: "completed" }];
    const first = startEmilyRoom(carried);
    assert.equal(first.started, true);
    assert.equal(
      questObjective(first.quests.find((quest) => quest.id === "emilys-room")!),
      "Her room. Nobody's touched it.",
    );
    const second = startEmilyRoom(first.quests);
    assert.equal(second.started, false);
    assert.equal(second.quests.filter((quest) => quest.id === "emilys-room").length, 1);

    const photo = finishEmilyRoom(first.quests);
    assert.equal(photo.completed, true);
    assert.equal(
      questObjective(photo.quests.find((quest) => quest.id === "emilys-room")!),
      EMILY_THOUGHTS.photo,
    );
    assert.equal(
      photo.quests.find((quest) => quest.id === "talk-to-mom")?.status,
      "completed",
    );
  });

  it("shows Dad's box only after the note", () => {
    const box = attic.choices.find((choice) => choice.action === "lookInDadsBox");
    assert.equal(box?.label, "Look in Dad's box");
    assert.ok(box?.hotspots?.length);
    assert.equal(atticHotspotVisible({}), false);
    assert.equal(atticHotspotVisible({ emilyNoteRead: true }), true);
    assert.equal(isChoiceAvailable(box!, availability({ scene: "attic" })), false);
    assert.equal(
      isChoiceAvailable(box!, availability({ scene: "attic", flags: { emilyNoteRead: true } })),
      true,
    );
    assert.equal(box?.closeup?.thought, "Dad and Walter. I'd forgotten they were friends.");
    assert.equal(box?.closeup?.inscriptions?.[0]?.text, "Walt & me, Miller Lake '64");
  });

  it("hides the gate hotspot from 03:00 until 07:00", () => {
    const gate = elrodHouse.choices.find((choice) => choice.action === "lookAtElrodGate");
    assert.equal(gate?.label, "Look at the gate");
    assert.equal(gateHotspotHidden(3 * 60), true);
    assert.equal(gateHotspotHidden(7 * 60 - 1), true);
    assert.equal(gateHotspotHidden(2 * 60 + 59), false);
    assert.equal(gateHotspotHidden(7 * 60), false);
    const flags = { margaretGossipHeard: true } as const;
    assert.equal(isChoiceAvailable(gate!, availability({ time: 3 * 60, flags })), false);
    assert.equal(isChoiceAvailable(gate!, availability({ time: 4 * 60, flags })), false);
    assert.equal(isChoiceAvailable(gate!, availability({ time: 7 * 60 - 1, flags })), false);
    assert.equal(isChoiceAvailable(gate!, availability({ time: 7 * 60, flags })), true);
    assert.equal(isChoiceAvailable(gate!, availability({ time: 2 * 60 + 59, flags })), true);
    assert.equal(isChoiceAvailable(gate!, availability({ time: 10 * 60 })), false);
  });
});

describe("save migration", () => {
  it("keeps an old save and fills clues from what Ethan had already found", () => {
    const legacy = migrateClues({
      storyFlags: { posterFound: true, fileDrawerSeen: true, sanatoriumCigaretteSeen: true },
    });
    assert.deepEqual(legacy.clues, ["man-in-a-hood", "faded-poster", "parker-e", "cigarette"]);
    assert.deepEqual(legacy.connections, []);

    const fresh = migrateClues({ clues: [] });
    assert.deepEqual(fresh.clues, []);

    const kept = migrateClues({
      clues: ["man-in-a-hood", "boot-print"],
      clueConnections: ["hood-boot", "not-a-link"],
      cluesSeen: ["man-in-a-hood"],
      storyFlags: { gazetteFound: true },
      askedAbout: { rachel: ["boot-print"], walter: ["nope"] },
    });
    assert.deepEqual(kept.clues, ["man-in-a-hood", "boot-print", "the-gazette"]);
    assert.deepEqual(kept.connections, ["hood-boot"]);
    assert.deepEqual(kept.cluesSeen, ["man-in-a-hood"]);
    assert.deepEqual(kept.askedAbout.rachel, ["boot-print"]);
    assert.equal(kept.askedAbout.walter, undefined);

    const quests = migrateQuestsFromLegacy({
      momTalked: true,
      quests: [
        { id: "talk-to-mom", status: "completed" },
        { id: "the-tape", status: "active" },
      ],
      storyFlags: { margaretGossipHeard: true, bootPrintSeen: true, emilyNoteRead: true },
      askedAbout: { rachel: ["boot-print"] },
    });
    assert.equal(quests.find((quest) => quest.id === "the-gate")?.status, "completed");
    assert.equal(quests.find((quest) => quest.id === "the-tape")?.status, "active");
    assert.equal(quests.find((quest) => quest.id === "emilys-room")?.status, "active");
    assert.equal(
      questObjective(quests.find((quest) => quest.id === "emilys-room")!),
      "Her room. Nobody's touched it.",
    );
  });
});

describe("chapter finds", () => {
  it("prints the Gazette on the porch and ends the hill on the hallway figure", () => {
    const paper = frontYard.choices.find((choice) => choice.action === "lookAtGazette");
    assert.equal(paper?.closeup?.inscriptions?.[0]?.text, NEWSPAPER.headline);
    assert.equal(paper?.closeup?.inscriptions?.[1]?.text, "Police ask residents to stay calm");
    assert.equal(paper?.closeup?.inscriptions?.[2]?.text, NEWSPAPER.body);
    assert.match(paper?.closeup?.image ?? "", /misc\/newspaperGazette\.png$/);
    assert.equal(gazetteOnPorch("Saturday", 7 * 60 + 30, false), true);
    assert.equal(gazetteOnPorch("Saturday", 12 * 60, false), false);
    assert.equal(gazetteOnPorch("Sunday", 8 * 60, false), false);

    const ash = sanatoriumRoom2.choices.find((choice) => choice.action === "lookAtSanatoriumCigarette");
    assert.equal(ash?.closeup?.thought, "Still burning. Someone was just here.");
    assert.equal(ash?.closeup?.next?.thought, "Someone's here.");
    assert.match(ash?.closeup?.next?.image ?? "", /sanatoriumHallwayNightFigure\.png$/);
    assert.equal(ash?.nextScene, "sanatorium-room-2");

    const music = emilyRoom.choices.find((choice) => choice.action === "lookAtEmilyMusicBox");
    const polaroid = emilyRoom.choices.find((choice) => choice.action === "lookAtEmilyPolaroid");
    const note = emilyRoom.choices.find((choice) => choice.action === "lookAtEmilyNote");
    assert.equal(music?.closeup?.thought, EMILY_THOUGHTS.musicBox);
    assert.equal(polaroid?.closeup?.thought, EMILY_THOUGHTS.polaroid);
    assert.equal(polaroid?.closeup?.inscriptions?.[0]?.text, "Em & Ethan, summer '71");
    assert.equal(note?.closeup?.thought, EMILY_THOUGHTS.note);
    assert.equal(note?.closeup?.inscriptions?.[0]?.text, "Dad's box is in the attic. Don't tell Mom. – E");
  });

  it("uses the day and evening lines when a visit has nothing new", () => {
    assert.equal(repeatVisitLine("rachel", 10 * 60), "Still can't stop looking at that tape.");
    assert.equal(repeatVisitLine("rachel", 18 * 60), "You should be home, Ethan. So should I.");
    assert.equal(repeatVisitLine("linda", 10 * 60), "There's coffee if you want it.");
    assert.equal(repeatVisitLine("linda", 18 * 60), "Lock the door when you come in, honey. Please.");
    assert.equal(repeatVisitLine("walter", 10 * 60), "I've got work, Ethan.");
    assert.equal(repeatVisitLine("walter", 19 * 60), "Go home before dark, kid.");
    assert.equal(repeatVisitLine("margaret", 11 * 60), "Refill, honey?");
    assert.equal(repeatVisitLine("margaret", 18 * 60), "You're looking thin, honey. Eat something.");

    const done: QuestProgress[] = [
      { id: "what-walter-said", status: "completed", step: "done" },
    ];
    assert.equal(
      visitHasNothingNew(rachelFrontYardConversation.choices, {
        storyFlags: {
          rachelMet: true,
          rachelTrusted: true,
          rachelKnowsHood: true,
          walterStationTalk: true,
        },
        quests: done,
        job: null,
        jobQuestTarget: null,
        usedLabels: [],
        openedAsEmployee: false,
        inventory: [],
        trust: defaultTrust(),
        money: 10,
      }),
      true,
    );
    assert.equal(
      visitHasNothingNew(rachelFrontYardConversation.choices, {
        storyFlags: { rachelMet: true, walterStationTalk: true },
        quests: [{ id: "what-walter-said", status: "active" }],
        job: null,
        jobQuestTarget: null,
        usedLabels: [],
        openedAsEmployee: false,
        inventory: [],
        trust: defaultTrust(),
        money: 10,
      }),
      false,
    );
    assert.equal(
      visitHasNothingNew(walterConversation.choices, {
        storyFlags: { walterStationTalk: true, rachelMet: true },
        quests: [],
        job: null,
        jobQuestTarget: null,
        usedLabels: [],
        openedAsEmployee: false,
        inventory: [],
        trust: defaultTrust(),
        money: 10,
      }),
      true,
    );
    assert.equal(
      visitHasNothingNew(momConversation.choices, {
        storyFlags: {},
        quests: [],
        job: null,
        jobQuestTarget: null,
        usedLabels: [],
        openedAsEmployee: false,
        inventory: [],
        trust: defaultTrust(),
        money: 10,
      }),
      false,
    );
  });
});
