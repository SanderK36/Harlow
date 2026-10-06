import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { walterConversation } from "./scenes.ts";
import { busStop, diner, elrodHouse } from "./scenes.ts";
import { conversationChoiceVisible } from "./conversationChoices.ts";
import { questObjective } from "./quests.ts";
import { isRainPlate, sceneWeatherPlate } from "./scenePlate.ts";

const hoodLabel = "I saw someone last night. End of the street. In a hood.";

function walterChoices(flags: { rachelMet?: boolean }, quests: { id: "the-tape" | "down-to-the-station"; status: "active" | "completed" }[]) {
  return walterConversation.choices.filter((choice) =>
    conversationChoiceVisible(choice, {
      storyFlags: flags,
      quests,
      job: null,
      jobQuestTarget: null,
      usedLabels: [],
      openedAsEmployee: false,
      inventory: [],
    }),
  ).map((choice) => choice.label);
}

describe("Walter's first talk", () => {
  it("offers the hood line once rachelMet is set", () => {
    const labels = walterChoices({ rachelMet: true }, [
      { id: "the-tape", status: "completed" },
      { id: "down-to-the-station", status: "active" },
    ]);
    assert.ok(labels.includes(hoodLabel));
  });

  it("offers the hood line when the goodbye quest has committed and the flag has not", () => {
    const labels = walterChoices({}, [
      { id: "the-tape", status: "completed" },
      { id: "down-to-the-station", status: "active" },
    ]);
    assert.ok(labels.includes(hoodLabel));
  });

  it("hides the hood line before Rachel's goodbye", () => {
    const labels = walterChoices({}, [{ id: "the-tape", status: "active" }]);
    assert.equal(labels.includes(hoodLabel), false);
  });
});

describe("Down to the Station note", () => {
  it("names the drawer only after the close-up flag", () => {
    assert.equal(
      questObjective(
        { id: "down-to-the-station", status: "completed", step: "done" },
        { storyFlags: { fileDrawerSeen: true } },
      ),
      "That drawer was still open. PARKER, E.",
    );
    assert.equal(
      questObjective(
        { id: "down-to-the-station", status: "completed", step: "done" },
        { storyFlags: {} },
      ),
      "Walter said go home. He knows something.",
    );
  });
});

describe("interim rain follows the plate", () => {
  it("leaves a rainy day plate alone and filters the dry night plate", () => {
    const day = sceneWeatherPlate(diner, 8 * 60 + 26, "Rainy");
    const night = sceneWeatherPlate(diner, 19 * 60, "Rainy");
    assert.equal(isRainPlate(day, diner, "Rainy"), true);
    assert.equal(isRainPlate(night, diner, "Rainy"), false);
  });

  it("filters the bus stop and the Elrod house, which have no rain art", () => {
    const stop = sceneWeatherPlate(busStop, 21 * 60, "Rainy");
    const house = sceneWeatherPlate(elrodHouse, 8 * 60 + 16, "Rainy");
    assert.equal(isRainPlate(stop, busStop, "Rainy"), false);
    assert.equal(isRainPlate(house, elrodHouse, "Rainy"), false);
  });
});
