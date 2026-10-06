import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isTiredWindow,
  isWaitingLocked,
  lateNightChoiceAllowed,
  sceneDistance,
} from "./lateNight.ts";
import { noticesAreHeld } from "./notices.ts";
import {
  QUEST_DEFS,
  coffeeErrandOpen,
  questTitle,
  type QuestId,
} from "./quests.ts";
import { isRainPlate, sceneWeatherPlate } from "./scenePlate.ts";
import {
  createBusChoices,
  createWalkingChoices,
  elrodHouse,
  ethanRoom,
  frontYard,
  hallway,
  isExteriorScene,
  kitchen,
  lightPole,
  momDeathConversation,
  rachelFrontYardConversation,
  sanatorium,
  sanatoriumHallway,
  sanatoriumNarration,
  sanatoriumRoom2,
  scenes,
  symmetricWalkMinutes,
  getSceneThought,
} from "./scenes.ts";
import { storyEntryApplies } from "./story.ts";

const THREE_FIFTEEN = 3 * 60 + 15;
const THREE_FORTY_FIVE = 3 * 60 + 45;

describe("late night, both gates", () => {
  const leave = sanatoriumRoom2.choices.find((choice) => choice.action === "leaveSanatoriumRoom2");
  const ash = sanatoriumRoom2.choices.find((choice) => choice.action === "lookAtSanatoriumCigarette");
  const enter = sanatoriumHallway.choices.find((choice) => choice.action === "enterSanatoriumRoom2");
  const sleep = ethanRoom.choices.find((choice) => choice.action === "goToSleep");
  const approach = sanatorium.choices.find((choice) => choice.action === "approachSanatorium");

  it("lets Ethan leave room 2 at 03:15 and at 03:45, and not look around", () => {
    assert.ok(leave && ash && enter && sleep && approach);
    for (const time of [THREE_FIFTEEN, THREE_FORTY_FIVE]) {
      assert.equal(isTiredWindow(time), true);
      assert.equal(
        lateNightChoiceAllowed(leave, { time, sceneId: "sanatorium-room-2" }),
        true,
      );
      assert.equal(
        lateNightChoiceAllowed(ash, { time, sceneId: "sanatorium-room-2" }),
        false,
      );
      assert.equal(
        lateNightChoiceAllowed(enter, { time, sceneId: "sanatorium-hallway" }),
        false,
      );
      assert.equal(
        lateNightChoiceAllowed(sleep, { time, sceneId: "ethan-room" }),
        true,
      );
      assert.equal(
        lateNightChoiceAllowed(approach, { time, sceneId: "sanatorium" }),
        false,
      );
    }
    const home = createWalkingChoices("sanatorium", ["front-yard"])[0];
    assert.equal(
      lateNightChoiceAllowed(home, { time: THREE_FIFTEEN, sceneId: "sanatorium" }),
      true,
    );
    assert.equal(
      lateNightChoiceAllowed(home, { time: THREE_FORTY_FIVE, sceneId: "sanatorium" }),
      true,
    );
  });

  it("locks waiting only from 03:30 until 07:00", () => {
    assert.equal(isWaitingLocked(THREE_FIFTEEN), false);
    assert.equal(isWaitingLocked(22 * 60), false);
    assert.equal(isWaitingLocked(209), false);
    assert.equal(isWaitingLocked(210), true);
    assert.equal(isWaitingLocked(THREE_FORTY_FIVE), true);
    assert.equal(isWaitingLocked(6 * 60 + 59), true);
    assert.equal(isWaitingLocked(7 * 60), false);
  });

  it("still allows the ash before 03:00 and after 07:00", () => {
    assert.ok(ash);
    assert.equal(lateNightChoiceAllowed(ash, { time: 179, sceneId: "sanatorium-room-2" }), true);
    assert.equal(lateNightChoiceAllowed(ash, { time: 420, sceneId: "sanatorium-room-2" }), true);
  });

  it("keeps the hill path open while Light on the Hill is active", () => {
    assert.ok(ash && enter && approach);
    const hill = frontYard.choices.find((choice) => choice.action === "lookAtSanatoriumHill");
    assert.ok(hill);
    assert.equal(hill.nextScene, "front-yard");
    assert.equal(
      lateNightChoiceAllowed(hill, { time: THREE_FIFTEEN, sceneId: "front-yard" }),
      true,
    );

    function cigaretteFromFrontYard(time: number, lightOnTheHillActive: boolean) {
      const seen = new Set<string>();
      const queue = ["front-yard"];
      while (queue.length) {
        const id = queue.pop();
        if (!id || seen.has(id)) continue;
        seen.add(id);
        const scene = scenes[id as keyof typeof scenes];
        const choices = [...scene.choices];
        if (isExteriorScene(id)) {
          choices.push(...createWalkingChoices(id, Object.keys(scenes).filter(isExteriorScene)));
        }
        for (const choice of choices) {
          if (!lateNightChoiceAllowed(choice, { time, sceneId: id, lightOnTheHillActive })) continue;
          if (choice.action === "lookAtSanatoriumCigarette") return choice;
          if (choice.nextScene && choice.nextScene !== id) queue.push(choice.nextScene);
        }
      }
      return undefined;
    }

    for (const time of [THREE_FIFTEEN, THREE_FORTY_FIVE]) {
      const cigarette = cigaretteFromFrontYard(time, true);
      assert.ok(cigarette, `cigarette reachable at ${time}`);
      assert.equal(cigarette.closeup?.thought, "Still burning. Someone was just here.");
      assert.ok(cigarette.setsFlags?.includes("chapter1Complete"));
      assert.equal(cigarette.completesQuest, "light-on-the-hill");
      assert.equal(
        lateNightChoiceAllowed(ash, { time, sceneId: "sanatorium-room-2", lightOnTheHillActive: true }),
        true,
      );
      assert.equal(
        lateNightChoiceAllowed(enter, { time, sceneId: "sanatorium-hallway", lightOnTheHillActive: true }),
        true,
      );
      assert.equal(
        lateNightChoiceAllowed(approach, { time, sceneId: "sanatorium", lightOnTheHillActive: true }),
        true,
      );
      assert.equal(cigaretteFromFrontYard(time, false), undefined);
      assert.equal(
        lateNightChoiceAllowed(ash, {
          time,
          sceneId: "sanatorium-room-2",
          lightOnTheHillActive: false,
        }),
        false,
      );
    }

    const wander = createWalkingChoices("front-yard", ["diner"])[0];
    assert.equal(
      lateNightChoiceAllowed(wander, {
        time: THREE_FIFTEEN,
        sceneId: "front-yard",
        lightOnTheHillActive: true,
      }),
      false,
    );
  });

  it("lets an open talk end, and blocks a new one", () => {
    const ctx = { time: THREE_FIFTEEN, sceneId: "kitchen" };
    assert.equal(lateNightChoiceAllowed({ response: [] }, ctx), false);
    assert.equal(lateNightChoiceAllowed({ response: [], endsConversation: true }, ctx), true);
  });

  it("can get home and to bed from every scene", () => {
    const exteriorIds = Object.keys(scenes).filter((id) => isExteriorScene(id));
    function reachesBed(start: string, time: number) {
      const seen = new Set<string>();
      const queue = [start];
      while (queue.length) {
        const id = queue.pop();
        if (!id || seen.has(id)) continue;
        seen.add(id);
        if (id === "ethan-room") return true;
        const scene = scenes[id as keyof typeof scenes];
        const choices = [...scene.choices];
        if (isExteriorScene(id)) choices.push(...createWalkingChoices(id, exteriorIds));
        for (const choice of choices) {
          if (!lateNightChoiceAllowed(choice, { time, sceneId: id })) continue;
          if (choice.nextScene && choice.nextScene !== id) queue.push(choice.nextScene);
        }
      }
      return false;
    }

    for (const id of Object.keys(scenes)) sceneDistance(id);
    const stuck = Object.keys(scenes).filter(
      (id) => !reachesBed(id, THREE_FIFTEEN) || !reachesBed(id, THREE_FORTY_FIVE),
    );
    assert.deepEqual(stuck, []);

    const upstairs = hallway.choices.find((choice) => choice.action === "goUpstairs");
    const outside = hallway.choices.find((choice) => choice.action === "leaveHouse");
    const toHall = kitchen.choices.find((choice) => choice.action === "goHome");
    assert.ok(upstairs && outside && toHall);
    assert.equal(lateNightChoiceAllowed(upstairs, { time: THREE_FIFTEEN, sceneId: "hallway" }), true);
    assert.equal(lateNightChoiceAllowed(outside, { time: THREE_FIFTEEN, sceneId: "hallway" }), false);
    assert.equal(lateNightChoiceAllowed(toHall, { time: THREE_FORTY_FIVE, sceneId: "kitchen" }), true);
  });
});

describe("quest lead titles", () => {
  it("names every quest, including What Walter Said", () => {
    const ids = Object.keys(QUEST_DEFS) as QuestId[];
    assert.ok(ids.includes("what-walter-said"));
    for (const id of ids) {
      const title = questTitle({ id, status: "active" }, { storyFlags: {}, inventory: [] });
      assert.notEqual(title, id);
      assert.ok(title.length > 0);
    }
    assert.equal(questTitle({ id: "what-walter-said", status: "active" }), "What Walter Said");
    assert.equal(
      questTitle({ id: "faded-poster", status: "active" }, { storyFlags: {} }),
      "Coffee for Mom",
    );
  });

  it("holds a lead card while a close-up or the chapter card is up", () => {
    assert.equal(noticesAreHeld({
      closeupOpen: true,
      conversationActive: false,
      chapterEndOpen: false,
    }), true);
    assert.equal(noticesAreHeld({
      closeupOpen: false,
      conversationActive: false,
      chapterEndOpen: true,
    }), true);
    assert.equal(noticesAreHeld({
      closeupOpen: false,
      conversationActive: false,
      chapterEndOpen: false,
    }), false);
  });
});

describe("approved chapter 1 lines", () => {
  it("drops the leading Yeah from Linda's four answers", () => {
    const labels = momDeathConversation.choices.slice(0, 4).map((choice) => choice.label);
    assert.deepEqual(labels, [
      "It's true. Walter wouldn't tell me anything else.",
      "Did you know her well?",
      "Do they know who did it?",
      "I can't believe it.",
    ]);
    for (const choice of momDeathConversation.choices.slice(0, 4)) {
      const spoken = choice.response.find((entry) => entry.type === "conversation");
      assert.equal(spoken?.type === "conversation" ? spoken.text : "", choice.label);
      assert.equal(choice.label.startsWith("Yeah."), false);
    }
  });

  it("names the ash and the file in the drawer", () => {
    assert.equal(
      sanatoriumRoom2.story.find((entry) => entry.type === "thought" && entry.text.includes("Ash"))?.type === "thought"
        ? sanatoriumRoom2.story.find((entry) => entry.type === "thought")?.text
        : "",
      "Ash on the floor tiles.",
    );
    const ash = sanatoriumRoom2.choices.find((choice) => choice.action === "lookAtSanatoriumCigarette");
    assert.equal(ash?.label, "Look at the ash");
    assert.equal(ash?.closeup?.thought, "Still burning. Someone was just here.");
    const file = rachelFrontYardConversation.choices.find((choice) => choice.requiresStoryFlag === "fileDrawerSeen");
    assert.equal(file?.label, "There was a file. PARKER, E. Still in his drawer.");
  });

  it("lights one sanatorium window at night until the hill quest is done", () => {
    assert.equal(
      sanatoriumNarration(3 * 60 + 23, false),
      "You reach the sanatorium. One window still lit. The rest are dark.",
    );
    assert.equal(
      sanatoriumNarration(10 * 60 + 35, false),
      "You reach the sanatorium. The building sits there, windows dark.",
    );
    assert.equal(
      sanatoriumNarration(3 * 60 + 23, true),
      "You reach the sanatorium. The building sits there, windows dark.",
    );
  });
});

describe("walks and the rainy front yard", () => {
  it("uses the longer time in both directions and leaves the bus at 10", () => {
    assert.equal(symmetricWalkMinutes("front-yard", "diner"), 30);
    assert.equal(symmetricWalkMinutes("diner", "front-yard"), 30);
    assert.equal(symmetricWalkMinutes("front-yard", "sanatorium"), 40);
    assert.equal(symmetricWalkMinutes("sanatorium", "front-yard"), 40);
    const ids = [
      "front-yard",
      "diner",
      "sanatorium",
      "hospital",
      "motel",
      "cementary",
      "scrapyard",
      "needle-and-groove",
      "gas-station",
      "police-station",
    ];
    for (const origin of ids) {
      for (const destination of ids) {
        if (origin === destination) continue;
        const going = createWalkingChoices(origin, [destination])[0];
        const back = createWalkingChoices(destination, [origin])[0];
        assert.equal(going.timeCost, back.timeCost);
        assert.equal(going.timeCost, symmetricWalkMinutes(origin, destination));
      }
    }
    assert.equal(createBusChoices(["diner"])[0].timeCost, 10);
  });

  it("uses the rainy day plates for the light pole and Ethan's room", () => {
    const poleDay = sceneWeatherPlate(lightPole, 10 * 60 + 35, "Rainy");
    const poleNight = sceneWeatherPlate(lightPole, 18 * 60 + 30, "Rainy");
    assert.match(poleDay, /lightPoleRainy\.png$/);
    assert.equal(isRainPlate(poleDay, lightPole, "Rainy"), true);
    assert.match(poleNight, /lightPoleNight\.png$/);
    assert.equal(isRainPlate(poleNight, lightPole, "Rainy"), false);

    const roomDay = sceneWeatherPlate(ethanRoom, 10 * 60 + 35, "Rainy");
    const roomNight = sceneWeatherPlate(ethanRoom, 22 * 60, "Rainy");
    assert.match(roomDay, /ethanRoomRainy\.png$/);
    assert.equal(isRainPlate(roomDay, ethanRoom, "Rainy"), true);
    assert.match(roomNight, /ethanRoomNight\.png$/);
    assert.equal(isRainPlate(roomNight, ethanRoom, "Rainy"), false);

    assert.equal(
      isRainPlate(
        "/images/locations/ElrodHouse/ElrodHouseRachelOutsideRainy.png",
        elrodHouse,
        "Rainy",
      ),
      true,
    );
    const emptyHouse = sceneWeatherPlate(elrodHouse, 10 * 60 + 35, "Rainy");
    assert.equal(isRainPlate(emptyHouse, elrodHouse, "Rainy"), false);
  });

  it("keeps the dry porch line off a wet evening", () => {
    const off = elrodHouse.story.find(
      (entry) => entry.type === "thought" && entry.text.startsWith("Her porch light's off"),
    );
    const on = elrodHouse.story.find(
      (entry) => entry.type === "thought" && entry.text.startsWith("Her porch light's still on"),
    );
    assert.ok(off && on);
    const evening = 18 * 60 + 30;
    assert.equal(storyEntryApplies(off, evening, "Sunny"), true);
    assert.equal(storyEntryApplies(off, evening, "Cloudy"), true);
    assert.equal(storyEntryApplies(off, evening, "Rainy"), false);
    assert.equal(storyEntryApplies(on, evening, "Rainy"), true);
    assert.equal(storyEntryApplies(on, evening, "Heavy rain"), true);
    assert.equal(storyEntryApplies(on, evening, "Thunderstorm"), true);
    assert.equal(storyEntryApplies(on, evening, "Sunny"), false);
    assert.equal(storyEntryApplies(on, 17 * 60 + 59, "Rainy"), false);
    assert.equal(storyEntryApplies(on, 30, "Rainy"), false);
    assert.equal(
      getSceneThought("elrod-house", evening, "Rainy"),
      "Her porch light's still on. Nobody's had the heart to turn it off.",
    );
    assert.equal(
      getSceneThought("elrod-house", evening, "Sunny"),
      "Her porch light's off. First time in twenty years.",
    );
    assert.equal(
      getSceneThought("elrod-house", 8 * 60 + 16, "Rainy"),
      "Rain's beating the tape flat. Washing the street clean.",
    );
  });

  it("uses the day plate for a rainy front yard at 10:35", () => {
    const day = sceneWeatherPlate(frontYard, 10 * 60 + 35, "Rainy");
    const night = sceneWeatherPlate(frontYard, 22 * 60, "Rainy");
    assert.match(day, /homeDayTime\.jpg$/);
    assert.equal(isRainPlate(day, frontYard, "Rainy"), false);
    assert.match(night, /homeOutsideRainy\.png$/);
    assert.equal(isRainPlate(night, frontYard, "Rainy"), true);
    assert.match(sceneWeatherPlate(frontYard, 10 * 60 + 35, "Thunderstorm"), /homeDayTime\.jpg$/);
    assert.match(sceneWeatherPlate(frontYard, 22 * 60, "Thunderstorm"), /homeThunderstorm\.png$/);
  });

  it("hides making coffee while Mom is out of it", () => {
    assert.equal(coffeeErrandOpen({ coffeeErrandHeard: true }), true);
    assert.equal(coffeeErrandOpen({ coffeeErrandHeard: true, coffeeDelivered: true }), false);
    assert.equal(coffeeErrandOpen({}), false);
  });
});
