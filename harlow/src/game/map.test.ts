import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { hillCheckScene, shouldNoticeHill } from "./hill.ts";
import { actionMinutes, isTiredWindow, lateNightChoiceAllowed } from "./lateNight.ts";
import {
  CLOSED_LOCATION_THOUGHTS,
  LATE_NIGHT_MAP_THOUGHT,
  MAP_PINS,
  MOM_MAP_THOUGHT,
  mapPinViews,
  mapPinsByWalkTime,
  mapTripChoice,
  type MapContext,
} from "./map.ts";
import { inkRevealLocationIds } from "./mapInkReveal.ts";
import { choiceAffordance } from "./statLabels.ts";
import type { QuestProgress, StoryFlag } from "./quests.ts";
import { travelDestinationIds } from "./travelDestinations.ts";

const MOM = "I should talk to Mom.";
const BEAT = "That can wait till morning. I'm beat.";

function ids(partial: {
  momTalked?: boolean;
  job?: "needle-groove" | "gas-station" | "scrapyard" | null;
  jobQuestTarget?: "needle-groove" | "gas-station" | "scrapyard" | null;
  quests?: QuestProgress[];
  flags?: StoryFlag[];
} = {}) {
  const flags = new Set(partial.flags ?? []);
  return travelDestinationIds({
    momTalked: partial.momTalked ?? false,
    job: partial.job ?? null,
    jobQuestTarget: partial.jobQuestTarget ?? null,
    quests: partial.quests ?? [],
    hasFlag: (flag) => flags.has(flag),
  });
}

function views(partial: Partial<MapContext> & { availableIds?: readonly string[] }) {
  const availableIds = partial.availableIds ?? ids({ momTalked: partial.momTalked ?? true });
  return mapPinViews({
    originId: partial.originId ?? "street",
    time: partial.time ?? 10 * 60,
    momTalked: partial.momTalked ?? true,
    lightOnTheHillActive: partial.lightOnTheHillActive ?? false,
    availableIds,
  });
}

function pin(list: ReturnType<typeof views>, id: string) {
  const found = list.find((item) => item.id === id);
  assert.ok(found, id);
  return found;
}

const hillReady: QuestProgress[] = [
  { id: "what-walter-said", status: "completed" },
  { id: "faded-poster", status: "completed" },
];

describe("travel destinations", () => {
  it("keeps home and the hospital, and hides chapter 2", () => {
    const closed = ids();
    assert.ok(closed.includes("front-yard"));
    assert.ok(closed.includes("hospital"));
    assert.equal(closed.includes("motel"), false);
    assert.equal(closed.includes("cementary"), false);
    assert.equal(closed.includes("diner"), false);
    assert.equal(closed.includes("elrod-house"), false);
    assert.equal(closed.includes("light-pole"), false);
  });

  it("opens the diner only after Talk to Mom", () => {
    assert.equal(ids().includes("diner"), false);
    assert.ok(ids({ momTalked: true }).includes("diner"));
  });

  it("opens the police station from Rachel or the station quest", () => {
    assert.equal(ids({ momTalked: true }).includes("police-station"), false);
    assert.ok(ids({ momTalked: true, flags: ["rachelMet"] }).includes("police-station"));
    assert.ok(ids({
      momTalked: true,
      quests: [{ id: "down-to-the-station", status: "active" }],
    }).includes("police-station"));
    assert.ok(ids({
      momTalked: true,
      quests: [{ id: "down-to-the-station", status: "completed" }],
    }).includes("police-station"));
  });

  it("opens a workplace from the flyer or the job", () => {
    assert.equal(ids({ momTalked: true }).includes("gas-station"), false);
    assert.ok(ids({ momTalked: true, jobQuestTarget: "gas-station" }).includes("gas-station"));
    assert.ok(ids({ momTalked: true, job: "needle-groove" }).includes("needle-and-groove"));
    assert.ok(ids({ momTalked: true, job: "scrapyard" }).includes("scrapyard"));
    assert.equal(ids({ momTalked: true, job: "scrapyard" }).includes("gas-station"), false);
  });

  it("opens the sanatorium only for Light on the Hill, not the street glimpse", () => {
    assert.equal(
      ids({ momTalked: true, flags: ["sanatoriumSeenFromStreet"] }).includes("sanatorium"),
      false,
    );
    assert.ok(ids({
      momTalked: true,
      quests: [{ id: "light-on-the-hill", status: "active" }],
    }).includes("sanatorium"));
    assert.ok(ids({
      momTalked: true,
      quests: [{ id: "light-on-the-hill", status: "completed" }],
    }).includes("sanatorium"));
  });
});

describe("map pins", () => {
  it("names every town pin and leaves the Elrod house and the light pole off", () => {
    assert.deepEqual(
      MAP_PINS.map((item) => [item.id, item.label]),
      [
        ["sanatorium", "Sanatorium"],
        ["cementary", "Cemetery"],
        ["needle-and-groove", "Needle & Groove"],
        ["police-station", "Police Station"],
        ["hospital", "Hospital"],
        ["diner", "Margaret's Diner"],
        ["gas-station", "Gas Station"],
        ["front-yard", "Home"],
        ["motel", "Motel"],
        ["scrapyard", "Scrapyard"],
      ],
    );
    const pinIds: string[] = MAP_PINS.map((item) => item.id);
    assert.equal(pinIds.includes("elrod-house"), false);
    assert.equal(pinIds.includes("light-pole"), false);
    for (const item of MAP_PINS) {
      assert.equal(/walter|light/i.test(item.label), false);
      assert.ok(item.label.length > 0);
    }
  });

  it("does not ink-reveal any place yet", () => {
    const reveal = inkRevealLocationIds();
    assert.deepEqual(reveal, []);
    for (const item of MAP_PINS) assert.equal(reveal.includes(item.id), false);
  });

  it("sorts the mobile list by the walk from here", () => {
    const sorted = mapPinsByWalkTime(views({ originId: "street", time: 10 * 60 }));
    assert.deepEqual(
      sorted.map((item) => [item.label, item.walkMinutes]),
      [
        ["Margaret's Diner", 25],
        ["Gas Station", 30],
        ["Home", 30],
        ["Needle & Groove", 30],
        ["Police Station", 30],
        ["Cemetery", 35],
        ["Hospital", 35],
        ["Motel", 40],
        ["Sanatorium", 40],
        ["Scrapyard", 40],
      ],
    );
  });

  it("closes every pin before Talk to Mom", () => {
    const list = views({ originId: "street", momTalked: false, time: 200 });
    for (const item of list) {
      assert.equal(item.open, false, item.id);
      assert.equal(item.thought, MOM, item.id);
    }
    assert.equal(MOM_MAP_THOUGHT, MOM);
  });

  it("opens home, the hospital, and the diner by day after Talk to Mom", () => {
    const list = views({ originId: "street", time: 10 * 60, momTalked: true });
    assert.equal(pin(list, "front-yard").open, true);
    assert.equal(pin(list, "hospital").open, true);
    assert.equal(pin(list, "diner").open, true);
    assert.equal(pin(list, "diner").thought, null);
    assert.equal(pin(list, "police-station").open, false);
    assert.equal(pin(list, "police-station").thought, CLOSED_LOCATION_THOUGHTS["police-station"]);
    assert.equal(pin(list, "sanatorium").thought, CLOSED_LOCATION_THOUGHTS.sanatorium);
    assert.equal(pin(list, "needle-and-groove").thought, CLOSED_LOCATION_THOUGHTS["needle-and-groove"]);
    assert.equal(pin(list, "gas-station").thought, CLOSED_LOCATION_THOUGHTS["gas-station"]);
    assert.equal(pin(list, "scrapyard").thought, CLOSED_LOCATION_THOUGHTS.scrapyard);
    assert.equal(pin(list, "motel").thought, CLOSED_LOCATION_THOUGHTS.motel);
    assert.equal(pin(list, "cementary").thought, CLOSED_LOCATION_THOUGHTS.cementary);
    assert.equal(pin(list, "motel").open, false);
    assert.equal(pin(list, "cementary").open, false);
  });

  it("lets only the trip home through from 03:00 until 07:00", () => {
    for (const time of [180, 200, 3 * 60 + 32, 419]) {
      assert.equal(isTiredWindow(time), true);
      const list = views({ originId: "diner", time, momTalked: true });
      assert.equal(pin(list, "diner").here, true);
      assert.equal(pin(list, "diner").thought, null);
      assert.equal(pin(list, "front-yard").open, true);
      assert.equal(pin(list, "front-yard").thought, null);
      for (const item of list) {
        if (item.id === "front-yard" || item.here) continue;
        assert.equal(item.open, false, `${item.id} at ${time}`);
        assert.equal(item.thought, BEAT, item.id);
      }
    }
    assert.equal(LATE_NIGHT_MAP_THOUGHT, BEAT);
    const morning = views({ originId: "diner", time: 420, momTalked: true });
    assert.equal(pin(morning, "hospital").open, true);
    assert.equal(pin(morning, "hospital").thought, null);
    const before = views({ originId: "diner", time: 179, momTalked: true });
    assert.equal(pin(before, "hospital").open, true);
  });

  it("keeps the sanatorium open at night only while Light on the Hill is active", () => {
    const activeIds = ids({
      momTalked: true,
      quests: [{ id: "light-on-the-hill", status: "active" }],
    });
    const during = views({
      originId: "front-yard",
      time: 200,
      momTalked: true,
      lightOnTheHillActive: true,
      availableIds: activeIds,
    });
    assert.equal(pin(during, "sanatorium").open, true);
    assert.equal(pin(during, "sanatorium").thought, null);
    assert.equal(pin(during, "hospital").open, false);
    assert.equal(pin(during, "hospital").thought, BEAT);

    const finishedIds = ids({
      momTalked: true,
      quests: [{ id: "light-on-the-hill", status: "completed" }],
    });
    const after = views({
      originId: "front-yard",
      time: 200,
      momTalked: true,
      lightOnTheHillActive: false,
      availableIds: finishedIds,
    });
    assert.equal(pin(after, "sanatorium").open, false);
    assert.equal(pin(after, "sanatorium").thought, BEAT);

    const day = views({
      originId: "street",
      time: 10 * 60,
      momTalked: true,
      availableIds: finishedIds,
    });
    assert.equal(pin(day, "sanatorium").open, true);

    const glimpse = views({
      originId: "street",
      time: 10 * 60,
      momTalked: true,
      availableIds: ids({ momTalked: true, flags: ["sanatoriumSeenFromStreet"] }),
    });
    assert.equal(pin(glimpse, "sanatorium").open, false);
    assert.equal(pin(glimpse, "sanatorium").thought, "Nobody goes up there. Not since it closed.");
  });

  it("prefers the late-night line over a story line, and Mom over both", () => {
    const latePolice = views({
      originId: "street",
      time: 200,
      momTalked: true,
      availableIds: ids({ momTalked: true, flags: ["rachelMet"] }),
    });
    assert.equal(pin(latePolice, "police-station").open, false);
    assert.equal(pin(latePolice, "police-station").thought, BEAT);

    const early = views({ originId: "street", time: 200, momTalked: false });
    assert.equal(pin(early, "motel").thought, MOM);
    assert.equal(pin(early, "front-yard").thought, MOM);
  });

  it("sends Home to the front yard and checks the hill on arrival", () => {
    const walkHome = mapTripChoice("diner", "front-yard", "walk", ["front-yard", "diner"]);
    assert.ok(walkHome);
    assert.equal(walkHome.nextScene, "front-yard");
    assert.equal(walkHome.travel, true);
    assert.equal(walkHome.timeCost, 30);
    const leaveAt = 17 * 60 + 50;
    const arriveAt = leaveAt + walkHome.timeCost;
    assert.equal(arriveAt, 18 * 60 + 20);
    assert.equal(hillCheckScene("diner", walkHome.nextScene), "front-yard");
    assert.equal(
      shouldNoticeHill(hillCheckScene("diner", walkHome.nextScene), arriveAt, hillReady, {}),
      true,
    );
    assert.equal(shouldNoticeHill("diner", arriveAt, hillReady, {}), false);
    assert.equal(
      shouldNoticeHill(hillCheckScene("front-yard", "diner"), arriveAt, hillReady, {}),
      false,
    );
    assert.equal(actionMinutes(3 * 60 + 32, walkHome.timeCost, true), walkHome.timeCost);
  });

  it("keeps the bus at $7 and 10 minutes, including the ride home after 03:00", () => {
    const available = ids({ momTalked: true });
    const bus = mapTripChoice("diner", "front-yard", "bus", available);
    const walk = mapTripChoice("diner", "front-yard", "walk", available);
    assert.ok(bus && walk);
    assert.equal(bus.timeCost, 10);
    assert.equal(bus.effects?.money, -7);
    assert.equal(bus.requirements?.money, 7);
    assert.equal(choiceAffordance(bus), "-$7 · 10 min");
    assert.equal(choiceAffordance(walk), `${walk.timeCost} min`);
    assert.equal(bus.nextScene, "front-yard");
    assert.equal(
      lateNightChoiceAllowed(bus, { time: 200, sceneId: "diner" }),
      true,
    );
    assert.equal(
      lateNightChoiceAllowed(walk, { time: 200, sceneId: "diner" }),
      true,
    );
    const away = mapTripChoice("front-yard", "diner", "walk", available);
    assert.ok(away);
    assert.equal(
      lateNightChoiceAllowed(away, {
        time: 200,
        sceneId: "front-yard",
        lightOnTheHillActive: true,
      }),
      false,
    );
    const hill = mapTripChoice("front-yard", "sanatorium", "bus", [
      ...available,
      "sanatorium",
    ]);
    assert.ok(hill);
    assert.equal(
      lateNightChoiceAllowed(hill, {
        time: 200,
        sceneId: "front-yard",
        lightOnTheHillActive: true,
      }),
      true,
    );
    assert.equal(
      lateNightChoiceAllowed(hill, { time: 200, sceneId: "front-yard" }),
      false,
    );
  });
});
